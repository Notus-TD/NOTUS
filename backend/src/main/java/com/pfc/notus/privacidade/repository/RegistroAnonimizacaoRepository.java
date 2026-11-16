package com.pfc.notus.privacidade.repository;

import com.pfc.notus.privacidade.domain.RegistroAnonimizacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

// ! REFP: Acesso ao banco da tabela tb_registro_anonimizacao (histórico de anonimizações)
@Repository
public interface RegistroAnonimizacaoRepository extends JpaRepository<RegistroAnonimizacao, Long> {

    // ! REFP: histórico completo, mais recente primeiro
    List<RegistroAnonimizacao> findAllByOrderByExecutadoEmDesc();

    // ! REFP: último registro de um usuário
    Optional<RegistroAnonimizacao> findFirstByUsuarioIdOrderByExecutadoEmDesc(Long usuarioId);
}
