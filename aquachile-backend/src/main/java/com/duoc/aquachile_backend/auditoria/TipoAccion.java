package com.duoc.aquachile_backend.auditoria;

/** Tipos de accion que quedan en el historial de cada usuario, agrupados por categoria para filtrar. */
public enum TipoAccion {
    SESION_INICIADA(Categoria.CUENTA),
    CONTRASENA_RESTABLECIDA(Categoria.CUENTA),
    GOOGLE_CONECTADO(Categoria.CUENTA),
    GOOGLE_DESCONECTADO(Categoria.CUENTA),

    USUARIO_CREADO(Categoria.ADMINISTRACION),
    ROL_CAMBIADO(Categoria.ADMINISTRACION),
    USUARIO_ACTIVADO(Categoria.ADMINISTRACION),
    USUARIO_DESACTIVADO(Categoria.ADMINISTRACION),
    CONTRASENA_CAMBIADA(Categoria.ADMINISTRACION),

    CANDIDATO_REGISTRADO(Categoria.CANDIDATOS),
    CANDIDATO_EDITADO(Categoria.CANDIDATOS),
    CANDIDATO_ELIMINADO(Categoria.CANDIDATOS),

    SOLICITUD_CREADA(Categoria.SOLICITUDES),
    EVALUADOR_ASIGNADO(Categoria.SOLICITUDES),
    CV_SUBIDO(Categoria.SOLICITUDES),
    INFORME_SUBIDO(Categoria.SOLICITUDES),
    SOLICITUD_FINALIZADA(Categoria.SOLICITUDES),
    SOLICITUD_ACTUALIZADA(Categoria.SOLICITUDES),

    ENTREVISTA_AGENDADA(Categoria.ENTREVISTAS),
    ENTREVISTA_REPROGRAMADA(Categoria.ENTREVISTAS),
    ENTREVISTA_REALIZADA(Categoria.ENTREVISTAS),

    SOLICITUD_PAUSADA(Categoria.PAUSAS_Y_CANCELACIONES),
    SOLICITUD_REANUADA(Categoria.PAUSAS_Y_CANCELACIONES),
    SOLICITUD_CANCELADA(Categoria.PAUSAS_Y_CANCELACIONES);

    public enum Categoria {
        CUENTA,
        ADMINISTRACION,
        CANDIDATOS,
        SOLICITUDES,
        ENTREVISTAS,
        PAUSAS_Y_CANCELACIONES
    }

    private final Categoria categoria;

    TipoAccion(Categoria categoria) {
        this.categoria = categoria;
    }

    public Categoria getCategoria() {
        return categoria;
    }
}
