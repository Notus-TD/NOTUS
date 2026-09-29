package com.pfc.notus.user.service;

import com.pfc.notus.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ProfessorService {

    @Autowired
    private UserRepository userRepository;
}
