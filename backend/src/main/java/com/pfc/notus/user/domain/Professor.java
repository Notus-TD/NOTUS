package com.pfc.notus.user.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// ! REFU: Entidade da tabela tb_professor: professor com nome completo
@Entity
@Table(name = "tb_professor")
@NoArgsConstructor
public class Professor extends User {

    @Getter @Setter
    private String fullName;

    // ! REFU: construtor do cadastro
    public Professor(String fullName, String email) {
        super(email);
        this.fullName = fullName;
    }

    /** Professor que saiu da escola: perde o acesso e o MFA, mas o nome fica no histórico do que lançou. */
    // ! REFU: saiu da escola: desativa e zera o MFA; o nome fica no histórico
    public void desligar() {
        setAtivo(false);
        limparMfa();
    }
}
