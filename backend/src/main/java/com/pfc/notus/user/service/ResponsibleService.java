package com.pfc.notus.user.service;

import com.pfc.notus.user.domain.Responsible;
import com.pfc.notus.user.dto.ResponsibleRequest;
import com.pfc.notus.user.repository.ResponsibleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class ResponsibleService {

    @Autowired
    private ResponsibleRepository responsibleRepository;

    @Autowired
    private UserService userService;

    @Transactional
    public Responsible findOrCreateResponsible(ResponsibleRequest dto) {
        Optional<Responsible> existente = responsibleRepository.findByEmail(dto.email());
        if (existente.isPresent()) {
            return existente.get();
        }

        Responsible responsible = new Responsible(
                dto.name(), dto.email(), dto.phone());

        return (Responsible) userService.register(responsible, "ROLE_RESPONSAVEL");
    }
}
