package com.pfc.notus.user.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record StudentRegistrationRequest(@Valid @NotNull ResponsibleRequest responsible, @Valid @NotNull StudentRequest student
) {
}
