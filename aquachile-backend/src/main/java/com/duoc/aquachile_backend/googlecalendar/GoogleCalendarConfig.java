package com.duoc.aquachile_backend.googlecalendar;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Propiedades app.google.calendar.* de application.properties. */
@Getter
@Component
public class GoogleCalendarConfig {

    /** Permisos que se le piden a la cuenta de Google: saber su correo y crear/editar eventos. */
    public static final String SCOPES = "openid email https://www.googleapis.com/auth/calendar.events";

    private final boolean enabled;
    private final String clientId;
    private final String clientSecret;
    private final String redirectUri;
    private final String frontendUrl;
    private final String authUrl;
    private final String tokenUrl;
    private final String userinfoUrl;
    private final String revokeUrl;
    private final String apiUrl;

    public GoogleCalendarConfig(
            @Value("${app.google.calendar.enabled}") boolean enabled,
            @Value("${app.google.calendar.client-id}") String clientId,
            @Value("${app.google.calendar.client-secret}") String clientSecret,
            @Value("${app.google.calendar.redirect-uri}") String redirectUri,
            @Value("${app.frontend-url}") String frontendUrl,
            @Value("${app.google.calendar.auth-url}") String authUrl,
            @Value("${app.google.calendar.token-url}") String tokenUrl,
            @Value("${app.google.calendar.userinfo-url}") String userinfoUrl,
            @Value("${app.google.calendar.revoke-url}") String revokeUrl,
            @Value("${app.google.calendar.api-url}") String apiUrl) {
        this.enabled = enabled;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.redirectUri = redirectUri;
        this.frontendUrl = frontendUrl;
        this.authUrl = authUrl;
        this.tokenUrl = tokenUrl;
        this.userinfoUrl = userinfoUrl;
        this.revokeUrl = revokeUrl;
        this.apiUrl = apiUrl;
    }

    /** La integracion funciona solo si esta activada y tiene las credenciales del proyecto de Google Cloud. */
    public boolean isListo() {
        return enabled && !clientId.isBlank() && !clientSecret.isBlank();
    }
}
