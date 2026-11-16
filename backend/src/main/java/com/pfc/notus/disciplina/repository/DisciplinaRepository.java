package com.pfc.notus.disciplina.repository;


import com.pfc.notus.disciplina.domain.Disciplina;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DisiciplinaRepository extends JpaRepository<Disciplina, Long> {

}
