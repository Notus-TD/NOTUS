package com.pfc.notus.comunicado.repository;

import com.pfc.notus.comunicado.domain.Comunicado;
import com.pfc.notus.comunicado.domain.PublicoComunicado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

// ! REFC: Acesso a dados com duas consultas principais: todos os comunicados de um ano + comunicados filtrados por público
@Repository
public interface ComunicadoRepository extends JpaRepository<Comunicado, Long> {

    // ! REFC: Retorna todos os comunicados de um ano letivo (para admin ver tudo); ordena por data descendente
    List<Comunicado> findByAnoLetivoOrderByEnviadoEmDesc(String anoLetivo);

    // ! REFC: Retorna comunicados que o usuário pode ver (filtro por público + ano); base de listarParaUsuario no service
    List<Comunicado> findByPublicoInAndAnoLetivoOrderByEnviadoEmDesc(Collection<PublicoComunicado> publicos, String anoLetivo);
}
