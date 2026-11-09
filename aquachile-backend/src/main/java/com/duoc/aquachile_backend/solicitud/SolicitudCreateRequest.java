package com.duoc.aquachile_backend.solicitud;

import com.duoc.aquachile_backend.candidatos.CandidatoRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Crea una solicitud de evaluacion. Se indica un candidato existente (candidatoId)
 * o los datos de uno nuevo (candidato); el servicio exige exactamente uno de los dos.
 */
public record SolicitudCreateRequest(
        Long candidatoId,
        @Valid
        CandidatoRequest candidato,
        @NotBlank(message = "El cargo es obligatorio")
        @Size(max = 160, message = "El cargo no puede superar los 160 caracteres")
        String cargo,
        @NotBlank(message = "La familia de cargo es obligatoria")
        @Size(max = 60, message = "La familia de cargo no puede superar los 60 caracteres")
        String familiaCargo) {
}
