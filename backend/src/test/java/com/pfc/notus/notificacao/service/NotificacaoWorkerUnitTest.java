package com.pfc.notus.notificacao.service;

import com.pfc.notus.notificacao.config.NotificacaoProperties;
import com.pfc.notus.notificacao.port.NotificadorPort;
import com.pfc.notus.notificacao.port.ResultadoEnvio;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificacaoWorkerUnitTest {

    @Mock
    private NotificacaoEnvioService envioService;

    @Mock
    private NotificadorPort notificador;

    @InjectMocks
    private NotificacaoWorker worker;

    @BeforeEach
    void setUp() {
        // taxa alta para a pausa entre envios ser de 1 ms
        ReflectionTestUtils.setField(worker, "properties", new NotificacaoProperties(1000, 3, 50));
    }

    @Test
    void cicloEnviaOLoteETerminaQuandoAFilaEsvazia() {
        when(envioService.reservarLote(any())).thenReturn(List.of(1L), List.of());
        when(envioService.preparar(1L)).thenReturn(Optional.of(
                new NotificacaoEnvioService.EnvioPreparado(1L, "resp@gmail.com", "falta_aluno", List.of("a"))));
        when(notificador.enviar(anyString(), anyString(), anyList())).thenReturn(ResultadoEnvio.sucesso("id-1"));

        worker.executar();

        verify(notificador).enviar("resp@gmail.com", "falta_aluno", List.of("a"));
        verify(envioService).registrarResultado(eq(1L), any());
        verify(envioService, times(2)).reservarLote(any());
    }

    @Test
    void pedidoDuranteUmCicloNaoRodaEmParaleloMasGeraMaisUmaVolta() throws Exception {
        CountDownLatch cicloComecou = new CountDownLatch(1);
        CountDownLatch liberarCiclo = new CountDownLatch(1);
        AtomicInteger emParalelo = new AtomicInteger();
        AtomicInteger maximoEmParalelo = new AtomicInteger();
        AtomicInteger chamadas = new AtomicInteger();

        when(envioService.reservarLote(any())).thenAnswer(inv -> {
            int agora = emParalelo.incrementAndGet();
            maximoEmParalelo.accumulateAndGet(agora, Math::max);
            if (chamadas.incrementAndGet() == 1) {
                cicloComecou.countDown();
                assertTrue(liberarCiclo.await(5, TimeUnit.SECONDS));
            }
            emParalelo.decrementAndGet();
            return List.of();
        });

        Thread primeiro = new Thread(worker::executar);
        primeiro.start();
        assertTrue(cicloComecou.await(5, TimeUnit.SECONDS));

        // Chega um pedido enquanto o primeiro ciclo está rodando: volta na hora, sem rodar junto.
        worker.executar();
        liberarCiclo.countDown();
        primeiro.join(5000);

        assertEquals(1, maximoEmParalelo.get(), "dois ciclos não podem rodar ao mesmo tempo");
        assertEquals(2, chamadas.get(), "o pedido no meio do ciclo gera mais uma volta");
    }
}
