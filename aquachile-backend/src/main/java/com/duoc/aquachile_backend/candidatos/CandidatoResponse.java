package com.duoc.aquachile_backend.candidatos;


public record CandidatoResponse(Long id, String nombre, String correo, String telefono) {

    public static CandidatoResponse from(Candidato c) {
        return new CandidatoResponse(c.getId(), c.getNombre(), c.getCorreo(), c.getTelefono());
    }
}
