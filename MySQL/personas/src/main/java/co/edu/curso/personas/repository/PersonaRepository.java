package co.edu.curso.personas.repository;

import co.edu.curso.personas.domain.Persona;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.query.Procedure;
import org.springframework.stereotype.Repository;

@Repository
public interface PersonaRepository extends JpaRepository<Persona, Long> {

    @Procedure("sp_contar_telefonos")
    Integer contarTelefonos(Long personaId);

}
