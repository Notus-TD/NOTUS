package com.pfc.notus.user.event;

import com.pfc.notus.notificacao.email.EmailHtml;
import com.pfc.notus.notificacao.email.ResendEmailClient;
import com.pfc.notus.notificacao.port.ResultadoEnvio;
import com.pfc.notus.notificacao.util.EmailUtil;
import com.pfc.notus.user.domain.enums.TipoTokenSenha;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class LinkSenhaEmailListener {

    private static final Logger log = LoggerFactory.getLogger(LinkSenhaEmailListener.class);

    private static final String RODAPE = "\n\nMensagem automática, não responda.";

    private final ResendEmailClient emailClient;
    private final String frontendUrl;
    private final boolean logarLink;

    public LinkSenhaEmailListener(ResendEmailClient emailClient,
                                  @Value("${app.frontend-url}") String frontendUrl,
                                  @Value("${app.senha.logar-link:false}") boolean logarLink) {
        this.emailClient = emailClient;
        this.frontendUrl = frontendUrl.replaceAll("/+$", "");
        this.logarLink = logarLink;
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void aoGerarLink(LinkSenhaGeradoEvent evento) {
        String link = frontendUrl + "/redefinir-senha?token=" + evento.token();

        if (logarLink) {
            log.info("[DEV] Link de {} para {}: {}", evento.tipo(), EmailUtil.mascarar(evento.email()), link);
        }

        ResultadoEnvio resultado = emailClient.enviarTexto(evento.email(), assunto(evento.tipo()),
                texto(evento.tipo(), link), new EmailHtml.Botao(rotuloBotao(evento.tipo()), link));
        if (resultado.tipo() == ResultadoEnvio.Tipo.SUCESSO) {
            log.info("E-mail de {} enviado para {}", evento.tipo(), EmailUtil.mascarar(evento.email()));
        } else {
            log.warn("Falha ao enviar e-mail de {} para {}: {}", evento.tipo(),
                    EmailUtil.mascarar(evento.email()), resultado.erro());
        }
    }

    static String rotuloBotao(TipoTokenSenha tipo) {
        return switch (tipo) {
            case CONVITE -> "Criar minha senha";
            case REDEFINICAO -> "Criar senha nova";
        };
    }

    static String assunto(TipoTokenSenha tipo) {
        return switch (tipo) {
            case CONVITE -> "NOTUS: ative seu acesso";
            case REDEFINICAO -> "NOTUS: redefinir senha";
        };
    }

    static String texto(TipoTokenSenha tipo, String link) {
        return switch (tipo) {
            case CONVITE -> "Olá! A escola criou sua conta no NOTUS.\n\n"
                    + "Para definir sua senha e começar a usar, abra o link abaixo. Ele vale por "
                    + tipo.getValidadeDescricao() + " e só pode ser usado uma vez:\n" + link + RODAPE;
            case REDEFINICAO -> "Olá! Recebemos um pedido para redefinir a senha da sua conta no NOTUS.\n\n"
                    + "Para criar uma senha nova, abra o link abaixo. Ele vale por "
                    + tipo.getValidadeDescricao() + " e só pode ser usado uma vez:\n" + link
                    + "\n\nSe você não fez esse pedido, ignore este e-mail: sua senha continua a mesma." + RODAPE;
        };
    }
}
