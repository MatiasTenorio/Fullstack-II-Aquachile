package com.duoc.aquachile_backend.solicitud;

import com.duoc.aquachile_backend.auth.UsuarioActual;
import com.duoc.aquachile_backend.drive.ArchivoUtil;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/** Alta de una solicitud por parte del analista, con su CV. */
@Service
@RequiredArgsConstructor
public class SolicitudRegistroService {

    private static final Set<String> FORMATOS_CV = Set.of("pdf", "doc", "docx");

    private final SolicitudService solicitudService;
    private final SolicitudArchivoService archivoService;

    /**
     * Crea la solicitud y guarda el CV en una sola transaccion: si el CV no se puede guardar,
     * no queda una solicitud a medias.
     */
    @Transactional
    public SolicitudResponse registrar(SolicitudCreateRequest datos, MultipartFile cv, UsuarioActual analista) {
        // Se valida el archivo antes de crear nada
        ArchivoUtil.leer(cv, ArchivoUtil.validar(cv, FORMATOS_CV));

        SolicitudResponse solicitud = solicitudService.crear(datos, analista);
        return archivoService.subirCv(solicitud.id(), cv);
    }
}
