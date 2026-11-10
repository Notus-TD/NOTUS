package com.pfc.notus.privacidade.repository;

import com.pfc.notus.privacidade.domain.RegistroAnonimizacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RegistroAnonimizacaoRepository extends JpaRepository<RegistroAnonimizacao, Long> {

    List<RegistroAnonimizacao> findAllByOrderByExecutadoEmDesc();

    Optional<RegistroAnonimizacao> findFirstByUsuarioIdOrderByExecutadoEmDesc(Long usuarioId);
}
