package com.duoc.aquachile_backend.auth;

/** Expresiones de @PreAuthorize reutilizables por los controladores. */
public final class Permisos {

    public static final String ANALISTA_O_ADMIN = "hasAnyRole('ANALISTA_RECLUTAMIENTO','ADMINISTRADOR')";
    public static final String ANALISTA_EVALUADOR_O_ADMIN =
            "hasAnyRole('ANALISTA_RECLUTAMIENTO','PROFESIONAL_EVALUADOR','ADMINISTRADOR')";
    public static final String EVALUADOR_O_ADMIN = "hasAnyRole('PROFESIONAL_EVALUADOR','ADMINISTRADOR')";

    private Permisos() {
    }
}
