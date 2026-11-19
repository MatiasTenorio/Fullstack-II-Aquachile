package com.duoc.aquachile_backend.auth.otp;

public enum PropositoOtp {
    /** El propio usuario define o restablece su contrasena. */
    RESTABLECER_PASSWORD,
    /** El administrador cambia la contrasena de otra cuenta; el codigo llega al correo del administrador. */
    CAMBIO_POR_ADMIN
}
