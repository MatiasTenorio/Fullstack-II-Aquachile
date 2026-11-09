package com.duoc.aquachile_backend.solicitud;

import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/** Familias de cargo y los cargos que pertenecen a cada una. Debe coincidir con catalogos.js del frontend. */
public final class CatalogoCargos {

    private static final Map<String, List<String>> CARGOS_POR_FAMILIA = Map.of(
            "Profesional A", List.of("Líder Desarrollo Producción"),
            "Profesional B C", List.of("Analista de Sistemas", "Coordinador servicios generales"),
            "Operario Calificado", List.of("Gruero"),
            "Técnico B C", List.of("Asistente Bodega Planta", "Operador Sala Control", "Monitor Producción"),
            "Técnico A", List.of("Tecnico Mantencion Senior"),
            "Supervisor B", List.of("Supervisor Planta"),
            "Jefatura", List.of("Jefe Area Piscicultura", "Jefe de SSO"));

    private CatalogoCargos() {
    }

    /** Lanza 400 si la familia no existe o si el cargo no pertenece a ella. */
    public static void validar(String familiaCargo, String cargo) {
        List<String> cargos = CARGOS_POR_FAMILIA.get(familiaCargo);
        if (cargos == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La familia de cargo no es valida");
        }
        if (!cargos.contains(cargo)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El cargo no pertenece a la familia " + familiaCargo);
        }
    }
}
