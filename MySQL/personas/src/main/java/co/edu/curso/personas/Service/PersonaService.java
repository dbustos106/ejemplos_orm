package co.edu.curso.personas.Service;

import co.edu.curso.personas.dto.PersonaRequest;
import co.edu.curso.personas.dto.PersonaResponse;

import java.util.List;

public interface PersonaService {
    PersonaResponse crear(PersonaRequest request);
    PersonaResponse obtenerPorId(Long id);
    List<PersonaResponse> listar();
    PersonaResponse actualizar(Long id, PersonaRequest request);
    void eliminar(Long id);
    int contarTelefonos(Long id);

}
