package com.pfc.notus.user.service;

import com.pfc.notus.exception.ResourceNotFoundException;
import com.pfc.notus.user.domain.Responsible;
import com.pfc.notus.user.dto.ResponsibleDTO;
import com.pfc.notus.user.dto.ResponsibleRequest;
import com.pfc.notus.user.repository.ResponsibleRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ResponsibleServiceUnitTest {

    @Mock
    private ResponsibleRepository responsibleRepository;

    @Mock
    private UserService userService;

    @InjectMocks
    private ResponsibleService responsibleService;

    private static Responsible responsavel(Long id) {
        Responsible r = new Responsible("Roberto Pereira", "roberto@gmail.com", "11981000000");
        r.setId(id);
        return r;
    }

    @Test
    void updateResponsibleAtualizaNomeTelefoneEEmail() {
        Responsible responsavel = responsavel(3L);
        when(responsibleRepository.findById(3L)).thenReturn(Optional.of(responsavel));
        when(responsibleRepository.save(responsavel)).thenReturn(responsavel);

        ResponsibleDTO atualizado = responsibleService.updateResponsible(3L,
                new ResponsibleRequest("Roberto P. Souza", "roberto.souza@gmail.com", "11999990000"));

        assertEquals("Roberto P. Souza", atualizado.name());
        assertEquals("11999990000", atualizado.phone());
        verify(userService).atualizarEmail(responsavel, "roberto.souza@gmail.com");
        verify(responsibleRepository).save(responsavel);
    }

    @Test
    void updateResponsibleLancaExcecaoQuandoResponsavelNaoExiste() {
        when(responsibleRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> responsibleService.updateResponsible(99L,
                new ResponsibleRequest("Roberto P. Souza", "roberto.souza@gmail.com", "11999990000")));
    }
}
