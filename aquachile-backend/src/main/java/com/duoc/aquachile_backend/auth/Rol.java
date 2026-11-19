package com.duoc.aquachile_backend.auth;

public enum Rol {
    ANALISTA_RECLUTAMIENTO("Analista de Reclutamiento"),
    PROFESIONAL_EVALUADOR("Profesional Evaluador"),
    ADMINISTRADOR("Administrador");

    private final String etiqueta;

    Rol(String etiqueta) {
        this.etiqueta = etiqueta;
    }

    /** Nombre del rol para mostrar (lo usan las descripciones del historial de acciones). */
    public String getEtiqueta() {
        return etiqueta;
    }
}
