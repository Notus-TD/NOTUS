package com.pfc.notus.comunicado.domain;

// ! REFC: Controla quem vê no portal + quem recebe e-mail (só TODOS e RESPONSAVEIS geram e-mail)
public enum PublicoComunicado {
    TODOS,
    ALUNOS,
    RESPONSAVEIS,
    PROFESSORES
}
