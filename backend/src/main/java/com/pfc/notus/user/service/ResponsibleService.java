package com.pfc.notus.user.service;

import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.user.domain.Responsible;
import com.pfc.notus.user.repository.ResponsibleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ResponsibleService {

    @Autowired
    private ResponsibleRepository responsibleRepository;

    public Responsible createReponsible(String name, String email, String cpf, String phone) {
        if (responsibleRepository.findByCpf(cpf).isEmpty()) {
            throw new ResourceNotFoundException("Responsible with CPF " + cpf + " not found");
        }
        return new Responsible(name, email, cpf, phone);
    }
}
