package com.pfc.notus.calendario.service;

import com.pfc.notus.boletim.domain.Bimestre;
import com.pfc.notus.calendario.domain.PeriodoLetivo;
import com.pfc.notus.calendario.domain.SituacaoPeriodo;
import com.pfc.notus.calendario.dto.CalendarioDTO;
import com.pfc.notus.calendario.dto.CalendarioRequest;
import com.pfc.notus.calendario.dto.PeriodoDTO;
import com.pfc.notus.calendario.dto.PeriodoRequest;
import com.pfc.notus.calendario.repository.PeriodoLetivoRepository;
import com.pfc.notus.config.AuditMarker;
import com.pfc.notus.exception.RegraNegocioException;
import com.pfc.notus.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class CalendarioService {

    private static final Logger log = LoggerFactory.getLogger(CalendarioService.class);
    private static final DateTimeFormatter DATA_BR = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    @Autowired
    private PeriodoLetivoRepository periodoRepository;

    @Transactional(readOnly = true)
    public CalendarioDTO getCalendario(String anoLetivo) {
        validarAno(anoLetivo);
        LocalDate hoje = LocalDate.now();
        List<PeriodoLetivo> periodos = periodoRepository.findByAnoLetivoOrderByInicio(anoLetivo);
        if (periodos.isEmpty()) {
            return new CalendarioDTO(anoLetivo, false, null, null, null, List.of());
        }

        Bimestre atual = periodos.stream().filter(p -> p.contem(hoje)).map(PeriodoLetivo::getBimestre).findFirst().orElse(null);
        return new CalendarioDTO(anoLetivo, true, periodos.getFirst().getInicio(), periodos.getLast().getFim(), atual,
                periodos.stream().map(p -> PeriodoDTO.from(p, hoje)).toList());
    }

    @Transactional
    public CalendarioDTO salvar(String anoLetivo, CalendarioRequest request, String adminEmail) {
        validarAno(anoLetivo);
        int ano = Integer.parseInt(anoLetivo);
        Set<Bimestre> informados = request.periodos().stream().map(PeriodoRequest::bimestre).collect(Collectors.toSet());
        if (!informados.equals(EnumSet.allOf(Bimestre.class))) {
            throw new RegraNegocioException("Informe as datas dos quatro bimestres.");
        }
        List<PeriodoRequest> ordenados = request.periodos().stream().sorted(Comparator.comparing(PeriodoRequest::bimestre)).toList();
        for (PeriodoRequest p : ordenados) {
            if (p.inicio().getYear() != ano || p.fim().getYear() != ano) {
                throw new RegraNegocioException("As datas do " + p.bimestre().getDescricao() + " precisam ser de " + anoLetivo + ".");
            }
            if (p.fim().isBefore(p.inicio())) {
                throw new RegraNegocioException("No " + p.bimestre().getDescricao() + ", o fim vem antes do início.");
            }
        }
        for (int i = 1; i < ordenados.size(); i++) {
            if (!ordenados.get(i).inicio().isAfter(ordenados.get(i - 1).fim())) {
                throw new RegraNegocioException("O " + ordenados.get(i).bimestre().getDescricao()
                        + " precisa começar depois do fim do " + ordenados.get(i - 1).bimestre().getDescricao() + ".");
            }
        }

        for (PeriodoRequest p : ordenados) {
            PeriodoLetivo periodo = periodoRepository.findByAnoLetivoAndBimestre(anoLetivo, p.bimestre())
                    .orElseGet(() -> new PeriodoLetivo(anoLetivo, p.bimestre(), p.inicio(), p.fim()));
            periodo.setInicio(p.inicio());
            periodo.setFim(p.fim());
            periodoRepository.save(periodo);
        }
        log.info(AuditMarker.AUDIT, "Calendário letivo de {} salvo por {}", anoLetivo, adminEmail);
        return getCalendario(anoLetivo);
    }

    @Transactional
    public CalendarioDTO reabrir(String anoLetivo, Bimestre bimestre, String adminEmail) {
        PeriodoLetivo periodo = periodo(anoLetivo, bimestre);
        if (periodo.situacao(LocalDate.now()) != SituacaoPeriodo.FECHADO) {
            throw new RegraNegocioException("Só um bimestre fechado pode ser reaberto.");
        }

        periodo.setReaberto(true);
        log.info(AuditMarker.AUDIT, "{} de {} reaberto por {}", bimestre.getDescricao(), anoLetivo, adminEmail);
        return getCalendario(anoLetivo);
    }

    @Transactional
    public CalendarioDTO fechar(String anoLetivo, Bimestre bimestre, String adminEmail) {
        PeriodoLetivo periodo = periodo(anoLetivo, bimestre);
        if (periodo.situacao(LocalDate.now()) != SituacaoPeriodo.REABERTO) {
            throw new RegraNegocioException("Só um bimestre reaberto pode ser fechado de novo.");
        }

        periodo.setReaberto(false);
        log.info(AuditMarker.AUDIT, "{} de {} fechado de novo por {}", bimestre.getDescricao(), anoLetivo, adminEmail);
        return getCalendario(anoLetivo);
    }

    @Transactional(readOnly = true)
    public Optional<String> motivoBloqueioDaData(String anoLetivo, LocalDate data) {
        List<PeriodoLetivo> periodos = periodoRepository.findByAnoLetivoOrderByInicio(anoLetivo);
        if (periodos.isEmpty()) return Optional.empty();

        LocalDate inicio = periodos.getFirst().getInicio();
        LocalDate fim = periodos.getLast().getFim();
        if (data.isBefore(inicio) || data.isAfter(fim)) {
            return Optional.of("A data está fora do ano letivo de " + anoLetivo + " ("
                    + inicio.format(DATA_BR) + " a " + fim.format(DATA_BR) + ").");
        }
        Optional<PeriodoLetivo> periodo = periodos.stream().filter(p -> p.contem(data)).findFirst();
        if (periodo.isEmpty()) {
            return Optional.of("A data cai no recesso entre bimestres.");
        }
        if (periodo.get().situacao(LocalDate.now()) == SituacaoPeriodo.FECHADO) {
            return Optional.of(mensagemFechado(periodo.get().getBimestre()));
        }
        return Optional.empty();
    }

    @Transactional(readOnly = true)
    public void exigirDataLetiva(String anoLetivo, LocalDate data) {
        Optional<String> motivo = motivoBloqueioDaData(anoLetivo, data);
        if (motivo.isPresent()) {
            throw new RegraNegocioException(motivo.get());
        }
    }

    @Transactional(readOnly = true)
    public void exigirBimestreAberto(String anoLetivo, Bimestre bimestre) {
        Optional<PeriodoLetivo> periodo = periodoRepository.findByAnoLetivoAndBimestre(anoLetivo, bimestre);
        if (periodo.isEmpty()) return;
        if (periodo.get().situacao(LocalDate.now()) == SituacaoPeriodo.FECHADO) {
            throw new RegraNegocioException(mensagemFechado(bimestre));
        }
    }

    private PeriodoLetivo periodo(String anoLetivo, Bimestre bimestre) {
        validarAno(anoLetivo);
        return periodoRepository.findByAnoLetivoAndBimestre(anoLetivo, bimestre)
                .orElseThrow(() -> new ResourceNotFoundException("O calendário de " + anoLetivo + " ainda não foi cadastrado."));
    }

    private static String mensagemFechado(Bimestre bimestre) {
        return "O " + bimestre.getDescricao() + " está fechado. Peça à secretaria para reabrir.";
    }

    private static void validarAno(String anoLetivo) {
        if (anoLetivo == null || !anoLetivo.matches("\\d{4}")) {
            throw new RegraNegocioException("Ano letivo inválido. Use o ano com 4 dígitos, como 2026.");
        }
    }
}
