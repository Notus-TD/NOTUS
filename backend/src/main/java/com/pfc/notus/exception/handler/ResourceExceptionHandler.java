package com.pfc.notus.exception.handler;

import com.pfc.notus.exception.ConflictException;
import com.pfc.notus.exception.MuitasTentativasException;
import com.pfc.notus.exception.RegraNegocioException;
import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.exception.dto.StandardError;
import com.pfc.notus.exception.dto.ValidationError;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.Instant;

@ControllerAdvice
public class ResourceExceptionHandler {

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<StandardError> handleConflict(ConflictException e, HttpServletRequest request) {
        return buildStandardResponse(HttpStatus.CONFLICT, e, request);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<StandardError> handleIntegridade(DataIntegrityViolationException e, HttpServletRequest request) {
        return buildStandardResponse(HttpStatus.CONFLICT,
                new ConflictException("Não foi possível concluir: existem registros ligados a este item."), request);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<StandardError> handleNotFound(ResourceNotFoundException e, HttpServletRequest request) {
        return buildStandardResponse(HttpStatus.NOT_FOUND, e, request);
    }

    @ExceptionHandler(RegraNegocioException.class)
    public ResponseEntity<StandardError> handleRegraNegocio(RegraNegocioException e, HttpServletRequest request) {
        return buildStandardResponse(HttpStatus.UNPROCESSABLE_ENTITY, e, request);
    }

    @ExceptionHandler(MuitasTentativasException.class)
    public ResponseEntity<StandardError> handleMuitasTentativas(MuitasTentativasException e, HttpServletRequest request) {
        ResponseEntity<StandardError> resposta = buildStandardResponse(HttpStatus.TOO_MANY_REQUESTS, e, request);
        return ResponseEntity.status(resposta.getStatusCode())
                .header("Retry-After", String.valueOf(e.getSegundosParaLiberar()))
                .body(resposta.getBody());
    }

    // Login com e-mail ou senha errados (ou conta desativada): 401 com mensagem genérica, sem revelar qual errou.
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<StandardError> handleAutenticacao(AuthenticationException e, HttpServletRequest request) {
        return buildStandardResponse(HttpStatus.UNAUTHORIZED,
                new RegraNegocioException("E-mail ou senha inválidos."), request);
    }

    // Usuário logado tentando acessar dado de outro perfil (ex.: professor de outra turma).
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<StandardError> handleAcessoNegado(AccessDeniedException e, HttpServletRequest request) {
        return buildStandardResponse(HttpStatus.FORBIDDEN,
                new RegraNegocioException("Você não tem permissão para esta operação."), request);
    }

    // JSON malformado, valor de enum inexistente, id que não é número ou parâmetro obrigatório ausente.
    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class,
            MissingServletRequestParameterException.class})
    public ResponseEntity<StandardError> handleRequisicaoInvalida(Exception e, HttpServletRequest request) {
        return buildStandardResponse(HttpStatus.BAD_REQUEST,
                new RegraNegocioException("Requisição inválida: confira os dados enviados."), request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ValidationError> handleValidationError(MethodArgumentNotValidException e, HttpServletRequest request) {
        HttpStatus status = HttpStatus.UNPROCESSABLE_ENTITY;
        return buildValidationResponse(status, e, request);
    }

    private ResponseEntity<StandardError> buildStandardResponse(HttpStatus status, Exception e, HttpServletRequest request) {
        StandardError error = new StandardError(
                Instant.now(),
                status.value(),
                "Erro",
                e.getMessage(),
                request.getRequestURI()
        );
        return ResponseEntity.status(status).body(error);
    }

    private ResponseEntity<ValidationError> buildValidationResponse(HttpStatus status, MethodArgumentNotValidException e, HttpServletRequest request) {
        ValidationError err = new ValidationError(
                Instant.now(),
                status.value(),
                "Erro de validação",
                "Dados inválidos",
                request.getRequestURI()
        );
        for (FieldError f : e.getBindingResult().getFieldErrors()) {
            err.addError(f.getField(), f.getDefaultMessage());
        }

        return ResponseEntity.status(status).body(err);
    }
}