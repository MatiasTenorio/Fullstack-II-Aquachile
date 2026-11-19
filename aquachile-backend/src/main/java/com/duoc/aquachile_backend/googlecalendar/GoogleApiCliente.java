package com.duoc.aquachile_backend.googlecalendar;

import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

/**
 * Llamadas HTTP a Google: OAuth (canjear el codigo, renovar el token, revocar) y eventos de Calendar.
 * Se habla directo con la API REST, sin una libreria adicional.
 */
@Component
@RequiredArgsConstructor
public class GoogleApiCliente {

    private static final ParameterizedTypeReference<Map<String, Object>> MAPA = new ParameterizedTypeReference<>() {
    };

    private final GoogleCalendarConfig config;
    private final RestClient http = RestClient.create();

    /** refreshToken llega vacio (null) cuando Google solo renueva el token de acceso. */
    public record Tokens(String accessToken, String refreshToken, long expiraEnSegundos) {
    }

    /** Paso final de la autorizacion: cambia el codigo que entrega Google por los tokens de la cuenta. */
    public Tokens canjearCodigo(String codigo) {
        MultiValueMap<String, String> form = credenciales();
        form.add("grant_type", "authorization_code");
        form.add("code", codigo);
        form.add("redirect_uri", config.getRedirectUri());
        return pedirTokens(form);
    }

    /** Pide un token de acceso nuevo (dura cerca de una hora) usando el permiso permanente guardado. */
    public Tokens renovar(String refreshToken) {
        MultiValueMap<String, String> form = credenciales();
        form.add("grant_type", "refresh_token");
        form.add("refresh_token", refreshToken);
        try {
            return pedirTokens(form);
        } catch (RestClientResponseException e) {
            if (e.getStatusCode().value() == 400 && e.getResponseBodyAsString().contains("invalid_grant")) {
                throw new GoogleAutorizacionRevocadaException("Google rechazo el permiso guardado (invalid_grant)");
            }
            throw e;
        }
    }

    /** Correo de la cuenta de Google que autorizo. */
    public String correoDeLaCuenta(String accessToken) {
        Map<String, Object> datos = http.get()
                .uri(config.getUserinfoUrl())
                .headers(h -> h.setBearerAuth(accessToken))
                .retrieve()
                .body(MAPA);
        return datos != null && datos.get("email") != null ? datos.get("email").toString() : null;
    }

    /** Le avisa a Google que el permiso ya no se usara. */
    public void revocar(String token) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("token", token);
        http.post()
                .uri(config.getRevokeUrl())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .toBodilessEntity();
    }

    /** Crea el evento en el calendario principal de la cuenta y devuelve su id. */
    public String crearEvento(String accessToken, Map<String, Object> evento) {
        Map<String, Object> creado = http.post()
                .uri(config.getApiUrl() + "/calendars/primary/events")
                .headers(h -> h.setBearerAuth(accessToken))
                .contentType(MediaType.APPLICATION_JSON)
                .body(evento)
                .retrieve()
                .body(MAPA);
        if (creado == null || creado.get("id") == null) {
            throw new IllegalStateException("Google no devolvio el id del evento");
        }
        return creado.get("id").toString();
    }

    /** Reemplaza los datos del evento. Devuelve false si el evento ya no existe (lo borraron desde Google). */
    public boolean actualizarEvento(String accessToken, String eventoId, Map<String, Object> evento) {
        try {
            http.put()
                    .uri(config.getApiUrl() + "/calendars/primary/events/{id}", eventoId)
                    .headers(h -> h.setBearerAuth(accessToken))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(evento)
                    .retrieve()
                    .toBodilessEntity();
            return true;
        } catch (RestClientResponseException e) {
            if (yaNoExiste(e)) {
                return false;
            }
            throw e;
        }
    }

    /** Borra el evento; si ya no existe no es un error. */
    public void eliminarEvento(String accessToken, String eventoId) {
        try {
            http.delete()
                    .uri(config.getApiUrl() + "/calendars/primary/events/{id}", eventoId)
                    .headers(h -> h.setBearerAuth(accessToken))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException e) {
            if (!yaNoExiste(e)) {
                throw e;
            }
        }
    }

    private boolean yaNoExiste(RestClientResponseException e) {
        int estado = e.getStatusCode().value();
        return estado == HttpStatus.NOT_FOUND.value() || estado == HttpStatus.GONE.value();
    }

    private MultiValueMap<String, String> credenciales() {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("client_id", config.getClientId());
        form.add("client_secret", config.getClientSecret());
        return form;
    }

    private Tokens pedirTokens(MultiValueMap<String, String> form) {
        Map<String, Object> respuesta = http.post()
                .uri(config.getTokenUrl())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .body(MAPA);
        if (respuesta == null || respuesta.get("access_token") == null) {
            throw new IllegalStateException("Google no devolvio un token de acceso");
        }
        Object refresh = respuesta.get("refresh_token");
        Object expira = respuesta.get("expires_in");
        return new Tokens(
                respuesta.get("access_token").toString(),
                refresh != null ? refresh.toString() : null,
                expira instanceof Number n ? n.longValue() : 3600);
    }
}
