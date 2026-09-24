package com.pfc.notus.user.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "tb_professor")
@NoArgsConstructor
public class Professor extends User {

    @Getter @Setter
    private String fullName;

    public Professor(String fullName, String email) {
        super(email);
        this.fullName = fullName;
    }
}
