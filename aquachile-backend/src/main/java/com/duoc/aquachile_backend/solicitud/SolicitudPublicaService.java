package com.duoc.aquachile_backend.solicitud;

import com.duoc.aquachile_backend.candidatos.CandidatoRequest;
import com.duoc.aquachile_backend.drive.ArchivoUtil;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class SolicitudPublicaService {

    private static final Set<String> FORMATOS_CV = Set.of("pdf", "doc", "docx");

    private final SolicitudService solicitudService;
    private final SolicitudArchivoService archivoService;

    /**
     * Crea (o reutiliza, si el correo ya existe) el candidato, la solicitud y el CV en una sola transaccion: si el CV no se puede guardar,
     * no queda una solicitud a medias.
     */
    @Transactional
    public SolicitudPublicaResponse registrar(SolicitudPublicaRequest datos, MultipartFile cv) {
        // Se valida el archivo antes de crear nada
        ArchivoUtil.leer(cv, ArchivoUtil.validar(cv, FORMATOS_CV));

        SolicitudResponse solicitud = solicitudService.crear(new SolicitudCreateRequest(
                null,
                new CandidatoRequest(datos.nombreCandidato(), datos.correo(), null),
                datos.cargo(),
                datos.familiaCargo()));
        archivoService.subirCv(solicitud.id(), cv);

        return new SolicitudPublicaResponse(solicitud.id(), "Solicitud recibida correctamente");
    }
}
