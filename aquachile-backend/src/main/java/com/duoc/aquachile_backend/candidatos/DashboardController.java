package com.duoc.aquachile_backend.candidatos;

import com.duoc.aquachile_backend.auth.UsuarioActual;
import com.duoc.aquachile_backend.candidatos.dto.DashboardResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Pagina de inicio: cualquier usuario con sesion la consulta y recibe los indicadores de su rol. */
@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public DashboardResponse indicadores(@AuthenticationPrincipal Jwt jwt) {
        return dashboardService.indicadores(UsuarioActual.from(jwt));
    }
}
