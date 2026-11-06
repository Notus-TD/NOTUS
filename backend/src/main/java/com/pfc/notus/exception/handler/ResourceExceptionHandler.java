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
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.time.Instant;

@ControllerAdvice
public class ResourceExceptionHandler {

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<StandardError> handleConflict(ConflictException e, HttpServletRequest request) {
        return buildStandardResponse(HttpStatus.CONFLICT, e, request);
    }

    /**
     * Rede de segurança: uma operação que esbarra numa regra do banco (ex.: excluir algo que ainda
     * tem registros ligados) vira 409 com uma mensagem clara, em vez de erro interno (500).
     */
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

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ValidationError> handleValidationError(MethodArgumentNotValidException e, HttpServletRequest request) {
        HttpStatus status = HttpStatus.UNPROCESSABLE_ENTITY;
        return buildValidationResponse(status, e, request);
    }

    private ResponseEntity<StandardError> buildStandardResponse(HttpStatus status, Exception e, HttpServletRequest request) {
        StandardError error = new StandardError(
                Instant.now(),
                status.value(),
                "Error",
                e.getMessage(),
                request.getRequestURI()
        );
        return ResponseEntity.status(status).body(error);
    }

    private ResponseEntity<ValidationError> buildValidationResponse(HttpStatus status, MethodArgumentNotValidException e, HttpServletRequest request) {
        ValidationError err = new ValidationError(
                Instant.now(),
                status.value(),
                "Validation Error",
                "Invalid data",
                request.getRequestURI()
        );
        for (FieldError f : e.getBindingResult().getFieldErrors()) {
            err.addError(f.getField(), f.getDefaultMessage());
        }

        return ResponseEntity.status(status).body(err);
    }
}