package com.pfc.notus.user.event;

import com.pfc.notus.notificacao.util.EmailUtil;
import com.pfc.notus.user.domain.enums.TipoTokenSenha;

public record LinkSenhaGeradoEvent(String email, TipoTokenSenha tipo, String token) {

    @Override
    public String toString() {
        return "LinkSenhaGeradoEvent[email=" + EmailUtil.mascarar(email) + ", tipo=" + tipo + "]";
    }
}
