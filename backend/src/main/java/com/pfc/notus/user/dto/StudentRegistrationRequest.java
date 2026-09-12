package com.pfc.notus.user.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record StudentRegistrationRequest(
        @NotNull ResponsibleRequest responsible,
        @NotNull StudentRequest student
) {
}
