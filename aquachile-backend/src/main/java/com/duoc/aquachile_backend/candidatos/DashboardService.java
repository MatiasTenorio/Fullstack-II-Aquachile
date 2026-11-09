package com.duoc.aquachile_backend.candidatos;

import com.duoc.aquachile_backend.candidatos.dto.DashboardResponse;
import com.duoc.aquachile_backend.solicitud.EstadoSolicitud;
import com.duoc.aquachile_backend.solicitud.SolicitudRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final CandidatoRepository candidatoRepository;
    private final SolicitudRepository solicitudRepository;

    @Transactional(readOnly = true)
    public DashboardResponse indicadores() {
        return new DashboardResponse(
                candidatoRepository.count(),
                solicitudRepository.countByEstado(EstadoSolicitud.PENDIENTE),
                solicitudRepository.countByEstado(EstadoSolicitud.EN_PROCESO),
                solicitudRepository.countByEstado(EstadoSolicitud.FINALIZADO));
    }
}
