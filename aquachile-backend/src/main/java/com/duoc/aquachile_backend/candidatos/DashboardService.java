package com.duoc.aquachile_backend.candidatos;

import com.duoc.aquachile_backend.auth.Rol;
import com.duoc.aquachile_backend.auth.UsuarioActual;
import com.duoc.aquachile_backend.auth.UsuarioRepository;
import com.duoc.aquachile_backend.candidatos.dto.DashboardResponse;
import com.duoc.aquachile_backend.entrevista.EntrevistaService;
import com.duoc.aquachile_backend.solicitud.EstadoSolicitud;
import com.duoc.aquachile_backend.solicitud.SolicitudRepository;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private static final int MAX_PROXIMAS_ENTREVISTAS = 5;

    private final CandidatoRepository candidatoRepository;
    private final SolicitudRepository solicitudRepository;
    private final UsuarioRepository usuarioRepository;
    private final EntrevistaService entrevistaService;

    @Transactional(readOnly = true)
    public DashboardResponse indicadores(UsuarioActual actual) {
        return switch (actual.rol()) {
            case ANALISTA_RECLUTAMIENTO -> new DashboardResponse(
                    porEstado(solicitudRepository.contarPorEstado()),
                    candidatoRepository.count(),
                    solicitudRepository.countByResponsableIsNullAndEstadoIn(
                            List.of(EstadoSolicitud.PENDIENTE, EstadoSolicitud.EN_PROCESO, EstadoSolicitud.EN_PAUSA)),
                    null,
                    entrevistaService.proximas(actual, MAX_PROXIMAS_ENTREVISTAS),
                    null,
                    null);
            case PROFESIONAL_EVALUADOR -> new DashboardResponse(
                    porEstado(solicitudRepository.contarPorEstadoDeEvaluador(actual.id())),
                    null,
                    null,
                    solicitudRepository.countByResponsableIdAndEstadoAndInformeDriveFileIdIsNull(
                            actual.id(), EstadoSolicitud.EN_PROCESO),
                    entrevistaService.proximas(actual, MAX_PROXIMAS_ENTREVISTAS),
                    null,
                    null);
            case ADMINISTRADOR -> new DashboardResponse(
                    null, null, null, null, null,
                    usuariosPorRol(),
                    usuarioRepository.countByActivoFalse());
        };
    }

    /** Convierte las filas [estado, cantidad] en un mapa que trae todos los estados (en 0 si no hay solicitudes). */
    private Map<EstadoSolicitud, Long> porEstado(List<Object[]> filas) {
        Map<EstadoSolicitud, Long> mapa = new EnumMap<>(EstadoSolicitud.class);
        for (EstadoSolicitud estado : EstadoSolicitud.values()) {
            mapa.put(estado, 0L);
        }
        for (Object[] fila : filas) {
            mapa.put((EstadoSolicitud) fila[0], (Long) fila[1]);
        }
        return mapa;
    }

    private Map<Rol, Long> usuariosPorRol() {
        Map<Rol, Long> mapa = new EnumMap<>(Rol.class);
        for (Rol rol : Rol.values()) {
            mapa.put(rol, 0L);
        }
        for (Object[] fila : usuarioRepository.contarActivosPorRol()) {
            mapa.put((Rol) fila[0], (Long) fila[1]);
        }
        return mapa;
    }
}
