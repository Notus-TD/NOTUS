package com.pfc.notus.user.service;

import com.pfc.notus.exception.ConflictException;
import com.pfc.notus.user.domain.Responsible;
import com.pfc.notus.user.domain.User;
import com.pfc.notus.user.repository.ResponsibleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ResponsibleService {

    @Autowired
    private ResponsibleRepository responsibleRepository;

    // user já deve estar persistido: @MapsId deriva o id do Responsible a partir dele.
    public Responsible createReponsible(User user, String name, String email, String cpf, String phone) {
        if (responsibleRepository.findByCpf(cpf).isPresent()) {
            throw new ConflictException("CPF já cadastrado: " + cpf);
        }

        Responsible responsible = new Responsible(name, email, phone, cpf);
        responsible.setUser(user);
        return responsibleRepository.save(responsible);
    }
}
