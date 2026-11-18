package co.edu.curso.personas.dto;

import java.util.List;

public record PersonaResponse(
        Long id,
        String nombre,
        String email,
        List<TelefonoResponse> telefonos
) {}
