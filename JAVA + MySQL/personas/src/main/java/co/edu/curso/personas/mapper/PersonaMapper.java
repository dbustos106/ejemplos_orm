package co.edu.curso.personas.mapper;

import co.edu.curso.personas.domain.Persona;
import co.edu.curso.personas.domain.Telefono;
import co.edu.curso.personas.dto.PersonaRequest;
import co.edu.curso.personas.dto.PersonaResponse;
import co.edu.curso.personas.dto.TelefonoRequest;
import co.edu.curso.personas.dto.TelefonoResponse;
import co.edu.curso.personas.util.TelefonoUtil;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class PersonaMapper {

    public Persona toEntity(PersonaRequest request) {
        Persona persona = new Persona();
        updateEntity(persona, request);
        return persona;
    }

    public void updateEntity(Persona persona, PersonaRequest request) {
        persona.setNombre(request.nombre());
        persona.setEmail(request.email());
        persona.getTelefonos().clear();
        if (request.telefonos() != null) {
            request.telefonos().forEach(t -> persona.agregarTelefono(toEntity(t)));
        }
    }

    public PersonaResponse toResponse(Persona persona) {
        List<TelefonoResponse> telefonos = persona.getTelefonos().stream()
                .map(this::toResponse)
                .toList();
        return new PersonaResponse(persona.getId(), persona.getNombre(), persona.getEmail(), telefonos);
    }

    private Telefono toEntity(TelefonoRequest request) {
        Telefono telefono = new Telefono();
        telefono.setNumero(TelefonoUtil.normalizar(request.numero()));
        return telefono;
    }

    private TelefonoResponse toResponse(Telefono telefono) {
        return new TelefonoResponse(telefono.getId(), telefono.getNumero());
    }

}
