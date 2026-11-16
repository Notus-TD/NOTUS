package com.pfc.notus.user.repository;

import com.pfc.notus.user.domain.TokenSenha;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

// ! REFU: Acesso ao banco da tabela tb_token_senha (links de convite e redefinição)
@Repository
public interface TokenSenhaRepository extends JpaRepository<TokenSenha, Long> {

    // ! REFU: token pelo hash (o token em si nunca é guardado)
    Optional<TokenSenha> findByTokenHash(String tokenHash);

    // ! REFU: quantos links o usuário pediu desde uma data (limite por hora)
    long countByUserIdAndCriadoEmAfter(Long userId, LocalDateTime desde);

    // ! REFU: invalida todos os links ainda abertos do usuário
    @Modifying
    @Query("UPDATE TokenSenha t SET t.encerradoEm = :agora WHERE t.user.id = :userId AND t.encerradoEm IS NULL")
    int encerrarAbertos(Long userId, LocalDateTime agora);
}
