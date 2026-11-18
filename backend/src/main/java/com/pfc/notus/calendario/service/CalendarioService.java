package com.pfc.notus.calendario.service;

import com.pfc.notus.boletim.domain.Bimestre;
import com.pfc.notus.calendario.domain.PeriodoLetivo;
import com.pfc.notus.calendario.dto.CalendarioDTO;
import com.pfc.notus.calendario.dto.CalendarioRequest;
import com.pfc.notus.calendario.dto.PeriodoDTO;
import com.pfc.notus.calendario.dto.PeriodoRequest;
import com.pfc.notus.calendario.repository.PeriodoLetivoRepository;
import com.pfc.notus.config.AuditMarker;
import com.pfc.notus.exception.RegraNegocioException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import lombok.RequiredArgsConstructor;
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

/**
 * Calendário letivo: as datas dos quatro bimestres de cada ano. Um bimestre fica aberto para lançamentos até a
 * data de fim e fecha sozinho depois dela; para corrigir algo, a secretaria muda a data de fim.
 */
// ! REFCAL: Guarda as datas dos 4 bimestres por ano e diz se um bimestre/data ainda aceita lançamento (nota, falta, atividade)
@Service
@RequiredArgsConstructor
public class CalendarioService {

    // ! REFCAL: log de auditoria e formato de data usado nas mensagens
    private static final Logger log = LoggerFactory.getLogger(CalendarioService.class);
    private static final DateTimeFormatter DATA_BR = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    // ! REFCAL: repositório dos períodos (bimestres) cadastrados
    private final PeriodoLetivoRepository periodoRepository;

    // ! REFCAL: devolve o calendário do ano: início/fim, qual bimestre está rolando hoje e se cada um está aberto
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

    // ! REFCAL: admin salva as datas dos 4 bimestres; valida e cria ou atualiza cada período
    @Transactional
    public CalendarioDTO salvar(String anoLetivo, CalendarioRequest request, String adminEmail) {
        validarAno(anoLetivo);
        List<PeriodoRequest> bimestres = validarBimestres(anoLetivo, request.periodos());
        for (PeriodoRequest p : bimestres) {
            PeriodoLetivo periodo = periodoRepository.findByAnoLetivoAndBimestre(anoLetivo, p.bimestre())
                    .orElseGet(() -> new PeriodoLetivo(anoLetivo, p.bimestre(), p.inicio(), p.fim()));
            periodo.setInicio(p.inicio());
            periodo.setFim(p.fim());
            periodoRepository.save(periodo);
        }
        log.info(AuditMarker.AUDIT, "Calendário letivo de {} salvo por {}", anoLetivo, adminEmail);
        return getCalendario(anoLetivo);
    }

    /**
     * Os 4 bimestres informados, com datas do próprio ano, fim depois do início e um começando
     * depois do fim do anterior. Devolve os bimestres em ordem (1º ao 4º).
     */
    // ! REFCAL: exige os 4 bimestres, datas dentro do ano, fim depois do início e sem sobreposição entre eles
    private static List<PeriodoRequest> validarBimestres(String anoLetivo, List<PeriodoRequest> periodos) {
        Set<Bimestre> informados = periodos.stream().map(PeriodoRequest::bimestre).collect(Collectors.toSet());
        if (!informados.equals(EnumSet.allOf(Bimestre.class))) {
            throw new RegraNegocioException("Informe as datas dos quatro bimestres.");
        }
        int ano = Integer.parseInt(anoLetivo);
        List<PeriodoRequest> ordenados = periodos.stream().sorted(Comparator.comparing(PeriodoRequest::bimestre)).toList();
        for (PeriodoRequest p : ordenados) {
            if (p.inicio().getYear() != ano || p.fim().getYear() != ano) {
                throw new RegraNegocioException("As datas do " + p.bimestre().getDescricao() + " precisam ser de " + anoLetivo + ".");
            }
            if (p.fim().isBefore(p.inicio())) {
                throw new RegraNegocioException("No " + p.bimestre().getDescricao() + ", o fim vem antes do início.");
            }
        }
        for (int i = 1; i < ordenados.size(); i++) {
            PeriodoRequest anterior = ordenados.get(i - 1);
            PeriodoRequest atual = ordenados.get(i);
            if (!atual.inicio().isAfter(anterior.fim())) {
                throw new RegraNegocioException("O " + atual.bimestre().getDescricao()
                        + " precisa começar depois do fim do " + anterior.bimestre().getDescricao() + ".");
            }
        }
        return ordenados;
    }

    /** Por que a data não aceita lançamento (fora do ano, recesso ou bimestre fechado). Vazio = pode lançar. */
    // ! REFCAL: explica por que uma data não aceita lançamento (fora do ano, recesso ou bimestre fechado); vazio = pode
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
        if (!periodo.get().aberto(LocalDate.now())) {
            return Optional.of(mensagemFechado(periodo.get().getBimestre()));
        }
        return Optional.empty();
    }

    // ! REFCAL: lança erro se a data estiver bloqueada (usado em falta e chamada)
    @Transactional(readOnly = true)
    public void exigirDataLetiva(String anoLetivo, LocalDate data) {
        Optional<String> motivo = motivoBloqueioDaData(anoLetivo, data);
        if (motivo.isPresent()) {
            throw new RegraNegocioException(motivo.get());
        }
    }

    // ! REFCAL: lança erro se o bimestre já fechou (usado em nota, atividade e nota final); sem calendário cadastrado deixa passar
    @Transactional(readOnly = true)
    public void exigirBimestreAberto(String anoLetivo, Bimestre bimestre) {
        Optional<PeriodoLetivo> periodo = periodoRepository.findByAnoLetivoAndBimestre(anoLetivo, bimestre);
        if (periodo.isEmpty()) return;
        if (!periodo.get().aberto(LocalDate.now())) {
            throw new RegraNegocioException(mensagemFechado(bimestre));
        }
    }
    // ! REFCAL: texto padrão de bimestre fechado
    private static String mensagemFechado(Bimestre bimestre) {
        return "O " + bimestre.getDescricao() + " já terminou e está fechado. Se precisar corrigir algo, peça à secretaria para ajustar a data de fim no calendário.";
    }

    // ! REFCAL: ano precisa ter 4 dígitos
    private static void validarAno(String anoLetivo) {
        if (anoLetivo == null || !anoLetivo.matches("\\d{4}")) {
            throw new RegraNegocioException("Ano letivo inválido. Use o ano com 4 dígitos, como 2026.");
        }
    }
}
