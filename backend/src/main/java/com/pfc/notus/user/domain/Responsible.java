package com.pfc.notus.user.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

// ! REFU: Entidade da tabela tb_responsible: responsável com nome, telefone e a lista de filhos
@Entity
@Table(name = "tb_responsible")
@NoArgsConstructor
public class Responsible extends User {

    @Getter @Setter
    private String name;

    @Getter @Setter
    private String phone;

    // ! REFU: alunos que ele é responsável
    @OneToMany(mappedBy = "responsible")
    @JsonIgnore
    @Getter @Setter
    private List<Student> students = new ArrayList<>();

    // ! REFU: construtor do cadastro
    public Responsible(String name, String email, String phone) {
        super(email);
        this.name = name;
        this.phone = phone;
    }

    /** LGPD: apaga nome e telefone, além dos dados de acesso. */
    // ! REFU: LGPD: apaga nome e telefone além dos dados de acesso
    @Override
    public void anonimizar() {
        super.anonimizar();
        this.name = null;
        this.phone = null;
    }
}
