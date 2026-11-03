package com.pfc.notus.user.repository;

import com.pfc.notus.user.domain.TokenSenha;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface TokenSenhaRepository extends JpaRepository<TokenSenha, Long> {

    Optional<TokenSenha> findByTokenHash(String tokenHash);

    long countByUserIdAndCriadoEmAfter(Long userId, LocalDateTime desde);

    @Modifying
    @Query("UPDATE TokenSenha t SET t.encerradoEm = :agora WHERE t.user.id = :userId AND t.encerradoEm IS NULL")
    int encerrarAbertos(Long userId, LocalDateTime agora);
}
