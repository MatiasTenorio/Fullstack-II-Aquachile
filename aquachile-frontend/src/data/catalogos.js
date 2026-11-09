// Textos y colores que el frontend muestra para los valores que maneja el backend.
// Si quieres cambiar cómo se ve un estado o un rol, se cambia aquí y en ningún otro lugar.

export const NOMBRES_CARGO = ['A', 'B', 'C'];
export const FAMILIAS_CARGO = ['Profesional A', 'Profesional B C'];

// Clave = valor que envía el backend.
export const ESTADOS_UI = {
  PENDIENTE: { etiqueta: 'Pendiente', bg: '#f8d7da', text: '#842029', clase: 'estado-pendiente' },
  EN_PROCESO: { etiqueta: 'En Proceso', bg: '#fff3cd', text: '#664d03', clase: 'estado-proceso' },
  FINALIZADO: { etiqueta: 'Completo', bg: '#d1e7dd', text: '#0f5132', clase: 'estado-completo' },
};

// El backend solo permite avanzar: PENDIENTE -> EN_PROCESO -> FINALIZADO.
export const SIGUIENTE_ESTADO = { PENDIENTE: 'EN_PROCESO', EN_PROCESO: 'FINALIZADO' };

export const ETIQUETA_ROL = {
  ANALISTA_RECLUTAMIENTO: 'Analista de Reclutamiento',
  PROFESIONAL_EVALUADOR: 'Profesional Evaluador',
  ADMINISTRADOR: 'Administrador',
  JEFATURA: 'Jefatura',
};

// Roles que el backend deja cambiar el estado de una solicitud (Jefatura solo consulta).
export const ROLES_CAMBIAN_ESTADO = ['ANALISTA_RECLUTAMIENTO', 'PROFESIONAL_EVALUADOR', 'ADMINISTRADOR'];

export const ETIQUETA_RESULTADO = {
  RECOMENDADO: 'Recomendado',
  RECOMENDADO_CON_OBSERVACIONES: 'Recomendado con observaciones',
  NO_RECOMENDADO: 'No recomendado',
};
