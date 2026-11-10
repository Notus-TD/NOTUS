package com.pfc.notus.user.repository;

import com.pfc.notus.user.domain.User;
import com.pfc.notus.user.projection.UserDetailsProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

	@Query("SELECT MAX(u.id) FROM User u")
	Long buscarUltimoId();

    @Query(nativeQuery = true, value = """
			SELECT tb_user.id AS id, tb_user.email AS username, tb_user.password,
			       tb_user.first_login AS firstLogin, tb_user.ativo AS ativo,
			       CASE WHEN tb_student.id IS NOT NULL AND tb_student.acesso_liberado_em IS NULL
			            THEN FALSE ELSE TRUE END AS acessoLiberado,
			       tb_role.id AS roleId, tb_role.authority
			FROM tb_user
			LEFT JOIN tb_student ON tb_student.id = tb_user.id
			INNER JOIN tb_user_role ON tb_user.id = tb_user_role.user_id
			INNER JOIN tb_role ON tb_role.id = tb_user_role.role_id
			WHERE tb_user.email = :email
		""")
    List<UserDetailsProjection> searchUserAndRolesByEmail(String email);
}

