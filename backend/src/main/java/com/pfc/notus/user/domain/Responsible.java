package com.pfc.notus.user.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tb_responsible")
@NoArgsConstructor
public class Responsible extends User {

    @Getter @Setter
    private String name;

    @Getter @Setter
    private String phone;

    @OneToMany(mappedBy = "responsible")
    @JsonIgnore
    @Getter @Setter
    private List<Student> students = new ArrayList<>();

    public Responsible(String name, String email, String phone) {
        super(email);
        this.name = name;
        this.phone = phone;
    }
}
