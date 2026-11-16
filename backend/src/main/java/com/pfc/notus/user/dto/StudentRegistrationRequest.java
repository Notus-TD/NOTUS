package com.pfc.notus.user.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

// ! REFU: Corpo do POST /students: dados do responsável + dados do aluno
public record StudentRegistrationRequest(@Valid @NotNull ResponsibleRequest responsible, @Valid @NotNull StudentRequest student
) {
}
