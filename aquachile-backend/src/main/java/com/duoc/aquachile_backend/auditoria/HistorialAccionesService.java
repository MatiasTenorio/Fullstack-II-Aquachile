package com.duoc.aquachile_backend.auditoria;

import com.duoc.aquachile_backend.auth.Usuario;
import com.duoc.aquachile_backend.auth.UsuarioRepository;
import com.duoc.aquachile_backend.auth.dto.UsuarioAdminResponse;
import java.util.Arrays;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class HistorialAccionesService {

    public static final int ACCIONES_POR_PAGINA = 30;

    private final AccionUsuarioRepository accionRepository;
    private final UsuarioRepository usuarioRepository;

    /** Acciones de un usuario; si llega una categoria, solo las de esa categoria. */
    @Transactional(readOnly = true)
    public HistorialAccionesResponse historial(Long usuarioId, TipoAccion.Categoria categoria, int pagina) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        PageRequest pedido = PageRequest.of(Math.max(0, pagina), ACCIONES_POR_PAGINA,
                Sort.by(Sort.Order.desc("fecha"), Sort.Order.desc("id")));
        Page<AccionUsuario> resultado;
        if (categoria == null) {
            resultado = accionRepository.findByUsuarioId(usuarioId, pedido);
        } else {
            List<TipoAccion> tipos = Arrays.stream(TipoAccion.values())
                    .filter(t -> t.getCategoria() == categoria)
                    .toList();
            resultado = accionRepository.findByUsuarioIdAndTipoIn(usuarioId, tipos, pedido);
        }
        return new HistorialAccionesResponse(
                UsuarioAdminResponse.from(usuario, accionRepository.ultimaAccionPorUsuarioMapa().get(usuarioId)),
                resultado.getContent().stream().map(AccionResponse::from).toList(),
                resultado.getNumber(),
                resultado.getTotalPages(),
                resultado.getTotalElements());
    }
}
