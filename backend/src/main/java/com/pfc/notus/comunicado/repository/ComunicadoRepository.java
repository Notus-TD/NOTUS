package com.pfc.notus.comunicado.repository;

import com.pfc.notus.comunicado.domain.Comunicado;
import com.pfc.notus.comunicado.domain.PublicoComunicado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface ComunicadoRepository extends JpaRepository<Comunicado, Long> {

    List<Comunicado> findByAnoLetivoOrderByEnviadoEmDesc(String anoLetivo);

    List<Comunicado> findByPublicoInAndAnoLetivoOrderByEnviadoEmDesc(Collection<PublicoComunicado> publicos, String anoLetivo);
}
