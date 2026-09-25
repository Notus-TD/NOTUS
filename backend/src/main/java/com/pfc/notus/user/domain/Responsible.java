package com.pfc.notus.user.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.time.LocalDateTime;
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

    @ColumnDefault("false")
    @Getter
    private boolean whatsappOptIn = false;

    @Getter
    private LocalDateTime whatsappOptInEm;

    @OneToMany(mappedBy = "responsible")
    @JsonIgnore
    @Getter @Setter
    private List<Student> students = new ArrayList<>();

    public Responsible(String name, String email, String phone) {
        super(email);
        this.name = name;
        this.phone = phone;
    }

    public void definirWhatsappOptIn(boolean ativo) {
        this.whatsappOptIn = ativo;
        this.whatsappOptInEm = LocalDateTime.now();
    }
}
