package com.pfc.notus.user.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tb_responsible")
@NoArgsConstructor
public class Responsible {

    @Id
    @Getter
    private Long id;

    @OneToOne
    @MapsId
    @JoinColumn(name = "id")
    @Getter @Setter
    private User user;

    @OneToMany(mappedBy = "responsible")
    @MapsId
    private List<Student> student = new ArrayList<>();

    @Getter @Setter
    private String name;

    @Getter @Setter
    private String email;

    @Getter @Setter
    private String phone;

    @Getter @Setter
    private String cpf;

    public Responsible(Long id,String name, String email, String phone, String cpf) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.cpf = cpf;
    }
}
