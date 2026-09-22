package com.pfc.notus.user.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record OnboardingRequest(
        @NotBlank @Size(min = 8) String newPassword,
        @NotNull @AssertTrue Boolean acceptTerms
) {
}
