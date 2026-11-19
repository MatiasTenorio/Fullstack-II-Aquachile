package com.duoc.aquachile_backend.auth;

/**
 * Expresiones de @PreAuthorize reutilizables por los controladores.
 * Analista: candidatos y creacion de solicitudes. Evaluador: gestiona las solicitudes que tiene asignadas.
 * Administrador: solo gestiona usuarios y roles.
 */
public final class Permisos {

    public static final String SOLO_ANALISTA = "hasRole('ANALISTA_RECLUTAMIENTO')";
    public static final String SOLO_EVALUADOR = "hasRole('PROFESIONAL_EVALUADOR')";
    public static final String SOLO_ADMIN = "hasRole('ADMINISTRADOR')";
    public static final String ANALISTA_O_EVALUADOR =
            "hasAnyRole('ANALISTA_RECLUTAMIENTO','PROFESIONAL_EVALUADOR')";

    private Permisos() {
    }
}
