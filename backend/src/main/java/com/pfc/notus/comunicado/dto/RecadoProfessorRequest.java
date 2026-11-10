package com.pfc.notus.comunicado.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

<<<<<<< HEAD
=======
// ! REFC: DTO de entrada para recados de professor (turma específica): público fixo=RESPONSAVEIS (não é informado aqui)
>>>>>>> eb86b0c86e7803a1df276d182ae1cf843dd8d402
public record RecadoProfessorRequest(
        @NotBlank @Size(max = 150) String titulo,
        @NotBlank @Size(max = 4000) String texto,
        @NotNull Long turmaId
) {
}
