package com.duoc.aquachile_backend.candidatos;

import com.duoc.aquachile_backend.candidatos.dto.DashboardResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public DashboardResponse indicadores() {
        return dashboardService.indicadores();
    }
}
