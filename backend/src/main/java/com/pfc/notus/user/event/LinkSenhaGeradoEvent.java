package com.pfc.notus.user.event;

import com.pfc.notus.notificacao.util.EmailUtil;
import com.pfc.notus.user.domain.enums.TipoTokenSenha;

/** Publicado quando um link de senha é criado; o e-mail só sai depois do commit. */
public record LinkSenhaGeradoEvent(String email, TipoTokenSenha tipo, String token) {

    @Override
    public String toString() {
        return "LinkSenhaGeradoEvent[email=" + EmailUtil.mascarar(email) + ", tipo=" + tipo + "]";
    }
}
