package com.pfc.notus.user.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

// ! REFU: Corpo do onboarding: nova senha (mín 8) e aceite dos termos (tem que ser true)
public record OnboardingRequest(
        @NotBlank @Size(min = 8) String newPassword,
        @NotNull @AssertTrue Boolean acceptTerms
) {
}
