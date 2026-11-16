package com.pfc.notus.user.domain;

import com.pfc.notus.user.dto.ResponsibleRequest;
import com.pfc.notus.user.dto.StudentRequest;
import com.pfc.notus.user.dto.security.AccountCredentialsDTO;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class UserEmailUnitTest {

    @Test
    void normalizarEmail_tiraEspacosEPassaParaMinusculas() {
        assertThat(User.normalizarEmail("  Ana.Souza@Escola.COM ")).isEqualTo("ana.souza@escola.com");
    }

    @Test
    void normalizarEmail_vazioViraNull() {
        assertThat(User.normalizarEmail("   ")).isNull();
        assertThat(User.normalizarEmail(null)).isNull();
    }

    @Test
    void usuario_guardaEmailNormalizadoNoCadastroENaAlteracao() {
        Responsible r = new Responsible("Ana", "Ana@Escola.com", "11999999999");
        assertThat(r.getEmail()).isEqualTo("ana@escola.com");

        r.setEmail(" NOVO@Escola.com");
        assertThat(r.getEmail()).isEqualTo("novo@escola.com");
    }

    @Test
    void requisicoes_normalizamEmailENome() {
        ResponsibleRequest resp = new ResponsibleRequest("  Ana Souza ", " ANA@escola.com", "11999999999");
        assertThat(resp.name()).isEqualTo("Ana Souza");
        assertThat(resp.email()).isEqualTo("ana@escola.com");

        StudentRequest aluno = new StudentRequest(" Bia ", " ", 20260001L, LocalDate.of(2012, 1, 1));
        assertThat(aluno.fullName()).isEqualTo("Bia");
        assertThat(aluno.educationalEmail()).isNull();

        assertThat(new AccountCredentialsDTO("Admin@Notus.com ", "x").email()).isEqualTo("admin@notus.com");
    }
}
