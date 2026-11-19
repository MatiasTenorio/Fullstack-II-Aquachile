import { ESTADOS_UI } from '../data/catalogos';
import { formatearFechaHora } from '../utils/fechas';

function etiqueta(estado) {
  return ESTADOS_UI[estado]?.etiqueta ?? estado;
}

// Bitácora de la solicitud, de lo más reciente a lo más antiguo: quién hizo cada cambio, cuándo y por qué.
function HistorialEstados({ historial }) {
  if (!historial || historial.length === 0) {
    return <p className="small text-muted mb-0">Esta solicitud no tiene movimientos registrados.</p>;
  }
  return (
    <ul className="historial-lista">
      {historial.map((registro) => {
        // Hay cambio de estado cuando el anterior existe y es distinto del nuevo
        const cambioEstado = registro.estadoAnterior && registro.estadoAnterior !== registro.estadoNuevo;
        return (
          <li key={registro.id}>
            <div className="historial-fecha">
              {formatearFechaHora(registro.fecha)} · {registro.usuarioNombre}
            </div>
            {cambioEstado && (
              <div className="fw-semibold">
                {etiqueta(registro.estadoAnterior)} → {etiqueta(registro.estadoNuevo)}
              </div>
            )}
            {registro.comentario && <div>{registro.comentario}</div>}
          </li>
        );
      })}
    </ul>
  );
}

export default HistorialEstados;
