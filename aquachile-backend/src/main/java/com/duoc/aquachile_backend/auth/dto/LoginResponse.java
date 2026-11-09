package com.duoc.aquachile_backend.auth.dto;

public record LoginResponse(String token, String tipo, long expiraEnSegundos, UsuarioResponse usuario) {
}
