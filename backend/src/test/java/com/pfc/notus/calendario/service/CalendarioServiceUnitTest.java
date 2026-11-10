package com.pfc.notus.calendario.service;

import com.pfc.notus.boletim.domain.Bimestre;
import com.pfc.notus.calendario.domain.PeriodoLetivo;
import com.pfc.notus.calendario.domain.SituacaoPeriodo;
import com.pfc.notus.calendario.dto.CalendarioDTO;
import com.pfc.notus.calendario.dto.CalendarioRequest;
import com.pfc.notus.calendario.dto.PeriodoRequest;
import com.pfc.notus.calendario.repository.PeriodoLetivoRepository;
import com.pfc.notus.exception.RegraNegocioException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CalendarioServiceUnitTest {

    private static final int ANO = LocalDate.now().getYear() - 1;
    private static final String ANO_LETIVO = String.valueOf(ANO);

    @Mock
    private PeriodoLetivoRepository periodoRepository;

    @InjectMocks
    private CalendarioService calendarioService;

    private static LocalDate dia(int mes, int dia) {
        return LocalDate.of(ANO, mes, dia);
    }

    private static List<PeriodoRequest> periodos() {
        return List.of(
                new PeriodoRequest(Bimestre.PRIMEIRO, dia(2, 2), dia(4, 24)),
                new PeriodoRequest(Bimestre.SEGUNDO, dia(5, 4), dia(7, 10)),
                new PeriodoRequest(Bimestre.TERCEIRO, dia(7, 27), dia(10, 2)),
                new PeriodoRequest(Bimestre.QUARTO, dia(10, 5), dia(12, 18)));
    }

    private static List<PeriodoLetivo> cadastrados() {
        return periodos().stream().map(p -> new PeriodoLetivo(ANO_LETIVO, p.bimestre(), p.inicio(), p.fim())).toList();
    }

    @Test
    void getCalendario_semCadastro_informaQueNaoFoiCadastrado() {
        when(periodoRepository.findByAnoLetivoOrderByInicio(ANO_LETIVO)).thenReturn(List.of());

        CalendarioDTO dto = calendarioService.getCalendario(ANO_LETIVO);

        assertFalse(dto.cadastrado());
        assertTrue(dto.periodos().isEmpty());
    }

    @Test
    void getCalendario_anoInvalido_recusa() {
        assertThrows(RegraNegocioException.class, () -> calendarioService.getCalendario("26"));
    }

    @Test
    void salvar_bimestresSobrepostos_recusa() {
        List<PeriodoRequest> sobrepostos = List.of(
                new PeriodoRequest(Bimestre.PRIMEIRO, dia(2, 2), dia(5, 10)),
                new PeriodoRequest(Bimestre.SEGUNDO, dia(5, 4), dia(7, 10)),
                new PeriodoRequest(Bimestre.TERCEIRO, dia(7, 27), dia(10, 2)),
                new PeriodoRequest(Bimestre.QUARTO, dia(10, 5), dia(12, 18)));

        RegraNegocioException erro = assertThrows(RegraNegocioException.class,
                () -> calendarioService.salvar(ANO_LETIVO, new CalendarioRequest(sobrepostos), "admin@notus.com"));

        assertEquals("O 2º bimestre precisa começar depois do fim do 1º bimestre.", erro.getMessage());
        verify(periodoRepository, never()).save(any());
    }

    @Test
    void salvar_dataDeOutroAno_recusa() {
        List<PeriodoRequest> outroAno = List.of(
                new PeriodoRequest(Bimestre.PRIMEIRO, dia(2, 2), dia(4, 24)),
                new PeriodoRequest(Bimestre.SEGUNDO, dia(5, 4), dia(7, 10)),
                new PeriodoRequest(Bimestre.TERCEIRO, dia(7, 27), dia(10, 2)),
                new PeriodoRequest(Bimestre.QUARTO, dia(10, 5), LocalDate.of(ANO + 1, 1, 20)));

        assertThrows(RegraNegocioException.class,
                () -> calendarioService.salvar(ANO_LETIVO, new CalendarioRequest(outroAno), "admin@notus.com"));
        verify(periodoRepository, never()).save(any());
    }

    @Test
    void salvar_bimestreRepetido_recusa() {
        List<PeriodoRequest> repetido = List.of(
                new PeriodoRequest(Bimestre.PRIMEIRO, dia(2, 2), dia(4, 24)),
                new PeriodoRequest(Bimestre.PRIMEIRO, dia(5, 4), dia(7, 10)),
                new PeriodoRequest(Bimestre.TERCEIRO, dia(7, 27), dia(10, 2)),
                new PeriodoRequest(Bimestre.QUARTO, dia(10, 5), dia(12, 18)));

        RegraNegocioException erro = assertThrows(RegraNegocioException.class,
                () -> calendarioService.salvar(ANO_LETIVO, new CalendarioRequest(repetido), "admin@notus.com"));

        assertEquals("Informe as datas dos quatro bimestres.", erro.getMessage());
    }

    @Test
    void salvar_datasValidas_gravaOsQuatroBimestres() {
        when(periodoRepository.findByAnoLetivoAndBimestre(eq(ANO_LETIVO), any())).thenReturn(Optional.empty());
        when(periodoRepository.findByAnoLetivoOrderByInicio(ANO_LETIVO)).thenReturn(cadastrados());

        CalendarioDTO dto = calendarioService.salvar(ANO_LETIVO, new CalendarioRequest(periodos()), "admin@notus.com");

        verify(periodoRepository, times(4)).save(any());
        assertTrue(dto.cadastrado());
        assertEquals(dia(2, 2), dto.inicio());
        assertEquals(dia(12, 18), dto.fim());
    }

    @Test
    void motivoBloqueioDaData_foraDoAnoLetivo() {
        when(periodoRepository.findByAnoLetivoOrderByInicio(ANO_LETIVO)).thenReturn(cadastrados());

        Optional<String> motivo = calendarioService.motivoBloqueioDaData(ANO_LETIVO, dia(1, 15));

        assertTrue(motivo.orElseThrow().startsWith("A data está fora do ano letivo de " + ANO_LETIVO));
    }

    @Test
    void motivoBloqueioDaData_recessoEntreBimestres() {
        when(periodoRepository.findByAnoLetivoOrderByInicio(ANO_LETIVO)).thenReturn(cadastrados());

        assertEquals(Optional.of("A data cai no recesso entre bimestres."),
                calendarioService.motivoBloqueioDaData(ANO_LETIVO, dia(7, 15)));
    }

    @Test
    void motivoBloqueioDaData_bimestreFechado() {
        when(periodoRepository.findByAnoLetivoOrderByInicio(ANO_LETIVO)).thenReturn(cadastrados());

        assertEquals(Optional.of("O 1º bimestre está fechado. Peça à secretaria para reabrir."),
                calendarioService.motivoBloqueioDaData(ANO_LETIVO, dia(3, 10)));
    }

    @Test
    void motivoBloqueioDaData_bimestreReaberto_liberaLancamento() {
        List<PeriodoLetivo> periodos = cadastrados();
        periodos.getFirst().setReaberto(true);
        when(periodoRepository.findByAnoLetivoOrderByInicio(ANO_LETIVO)).thenReturn(periodos);

        assertTrue(calendarioService.motivoBloqueioDaData(ANO_LETIVO, dia(3, 10)).isEmpty());
    }

    @Test
    void motivoBloqueioDaData_semCalendario_naoBloqueia() {
        when(periodoRepository.findByAnoLetivoOrderByInicio(ANO_LETIVO)).thenReturn(List.of());

        assertTrue(calendarioService.motivoBloqueioDaData(ANO_LETIVO, dia(3, 10)).isEmpty());
    }

    @Test
    void exigirBimestreAberto_bimestreFechado_recusa() {
        PeriodoLetivo primeiro = cadastrados().getFirst();
        when(periodoRepository.findByAnoLetivoAndBimestre(ANO_LETIVO, Bimestre.PRIMEIRO)).thenReturn(Optional.of(primeiro));

        assertThrows(RegraNegocioException.class,
                () -> calendarioService.exigirBimestreAberto(ANO_LETIVO, Bimestre.PRIMEIRO));
    }

    @Test
    void reabrir_bimestreFechado_ficaReaberto() {
        PeriodoLetivo primeiro = cadastrados().getFirst();
        when(periodoRepository.findByAnoLetivoAndBimestre(ANO_LETIVO, Bimestre.PRIMEIRO)).thenReturn(Optional.of(primeiro));
        when(periodoRepository.findByAnoLetivoOrderByInicio(ANO_LETIVO)).thenReturn(List.of(primeiro));

        calendarioService.reabrir(ANO_LETIVO, Bimestre.PRIMEIRO, "admin@notus.com");

        assertEquals(SituacaoPeriodo.REABERTO, primeiro.situacao(LocalDate.now()));
    }

    @Test
    void fechar_bimestreQueNaoFoiReaberto_recusa() {
        PeriodoLetivo primeiro = cadastrados().getFirst();
        when(periodoRepository.findByAnoLetivoAndBimestre(ANO_LETIVO, Bimestre.PRIMEIRO)).thenReturn(Optional.of(primeiro));

        assertThrows(RegraNegocioException.class,
                () -> calendarioService.fechar(ANO_LETIVO, Bimestre.PRIMEIRO, "admin@notus.com"));
    }
}
