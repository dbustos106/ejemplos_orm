package co.edu.curso.personas.Service;

import co.edu.curso.personas.domain.Persona;
import co.edu.curso.personas.dto.PersonaRequest;
import co.edu.curso.personas.dto.PersonaResponse;
import co.edu.curso.personas.exception.ResourceNotFoundException;
import co.edu.curso.personas.mapper.PersonaMapper;
import co.edu.curso.personas.repository.PersonaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PersonaServiceImpl implements PersonaService {

    private final PersonaRepository personaRepository;
    private final PersonaMapper personaMapper;

    @Override
    @Transactional
    public PersonaResponse crear(PersonaRequest request) {
        Persona persona = personaMapper.toEntity(request);
        return personaMapper.toResponse(personaRepository.save(persona));
    }

    @Override
    @Transactional(readOnly = true)
    public PersonaResponse obtenerPorId(Long id) {
        return personaMapper.toResponse(buscar(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PersonaResponse> listar() {
        return personaRepository.findAll().stream()
                .map(personaMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public PersonaResponse actualizar(Long id, PersonaRequest request) {
        Persona persona = buscar(id);
        personaMapper.updateEntity(persona, request);
        return personaMapper.toResponse(personaRepository.save(persona));
    }

    @Override
    @Transactional
    public void eliminar(Long id) {
        personaRepository.delete(buscar(id));
    }

    @Override
    @Transactional(readOnly = true)
    public int contarTelefonos(Long id) {
        buscar(id);
        return personaRepository.contarTelefonos(id);
    }

    private Persona buscar(Long id) {
        return personaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Persona", id));
    }
}
