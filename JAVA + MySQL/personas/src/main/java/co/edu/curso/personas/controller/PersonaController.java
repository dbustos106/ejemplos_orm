package co.edu.curso.personas.controller;

import co.edu.curso.personas.Service.PersonaService;
import co.edu.curso.personas.dto.PersonaRequest;
import co.edu.curso.personas.dto.PersonaResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/personas")
@RequiredArgsConstructor
public class PersonaController {

    private final PersonaService personaService;

    @PostMapping
    public ResponseEntity<PersonaResponse> crear(@Valid @RequestBody PersonaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(personaService.crear(request));
    }

    @GetMapping
    public List<PersonaResponse> listar() {
        return personaService.listar();
    }

    @GetMapping("/{id}")
    public PersonaResponse obtener(@PathVariable Long id) {
        return personaService.obtenerPorId(id);
    }

    @PutMapping("/{id}")
    public PersonaResponse actualizar(@PathVariable Long id, @Valid @RequestBody PersonaRequest request) {
        return personaService.actualizar(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {
        personaService.eliminar(id);
    }

    // Usa el procedimiento almacenado
    @GetMapping("/{id}/telefonos/total")
    public int contarTelefonos(@PathVariable Long id) {
        return personaService.contarTelefonos(id);
    }
}
