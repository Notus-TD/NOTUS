package com.pfc.notus.user.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tb_responsible")
@NoArgsConstructor
@AllArgsConstructor
public class Responsible {

    @Id
    private Long id;

    @OneToMany(mappedBy = "responsible")
    @MapsId
    private List<Student> student = new ArrayList<>();

    @Getter @Setter
    private String name;

    @Getter @Setter
    private String email;

    @Getter @Setter
    private String phone;

    @OneToMany(mappedBy = "responsible", cascade = CascadeType.ALL, orphanRemoval = true)
    @Getter @Setter
    private List<Student> students = new ArrayList<>();

}
