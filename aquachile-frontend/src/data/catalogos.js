// Textos y colores que el frontend muestra para los valores que maneja el backend.
// Si quieres cambiar cómo se ve un estado o un rol, se cambia aquí y en ningún otro lugar.

// Cada familia de cargo con los cargos que pertenecen a ella. Debe coincidir con CatalogoCargos.java del backend.
export const CARGOS_POR_FAMILIA = {
  'Profesional A': ['Líder Desarrollo Producción'],
  'Profesional B C': ['Analista de Sistemas', 'Coordinador servicios generales'],
  'Operario Calificado': ['Gruero'],
  'Técnico B C': ['Asistente Bodega Planta', 'Operador Sala Control', 'Monitor Producción'],
  'Técnico A': ['Tecnico Mantencion Senior'],
  'Supervisor B': ['Supervisor Planta'],
  'Jefatura': ['Jefe Area Piscicultura', 'Jefe de SSO'],
};
export const FAMILIAS_CARGO = Object.keys(CARGOS_POR_FAMILIA);
export const NOMBRES_CARGO = Object.values(CARGOS_POR_FAMILIA).flat();

// Clave = valor que envía el backend.
export const ESTADOS_UI = {
  PENDIENTE: { etiqueta: 'Pendiente', bg: '#f8d7da', text: '#842029', clase: 'estado-pendiente' },
  EN_PROCESO: { etiqueta: 'En Proceso', bg: '#fff3cd', text: '#664d03', clase: 'estado-proceso' },
  EN_PAUSA: { etiqueta: 'En pausa', bg: '#cff4fc', text: '#055160', clase: 'estado-pausa' },
  CANCELADO: { etiqueta: 'Cancelado', bg: '#d3d3d4', text: '#141619', clase: 'estado-cancelado' },
  FINALIZADO: { etiqueta: 'Completo', bg: '#d1e7dd', text: '#0f5132', clase: 'estado-completo' },
};

// Flujo normal: PENDIENTE -> EN_PROCESO (al agendar la entrevista) -> FINALIZADO (con el informe subido).
// Una solicitud pendiente o en proceso se puede pausar (y luego reanudar) o cancelar (sin vuelta atrás).
export const ESTADOS_CERRADOS = ['FINALIZADO', 'CANCELADO'];

// Entrevistas: valores que envía el backend y cómo se muestran.
export const ETIQUETA_MODALIDAD = { ONLINE: 'Online', PRESENCIAL: 'Presencial' };
export const ESTADOS_ENTREVISTA_UI = {
  AGENDADA: { etiqueta: 'Agendada', bg: '#fff3cd', text: '#664d03' },
  REALIZADA: { etiqueta: 'Realizada', bg: '#d1e7dd', text: '#0f5132' },
  CANCELADA: { etiqueta: 'Cancelada', bg: '#d3d3d4', text: '#141619' },
};
export const DURACIONES_ENTREVISTA = [30, 45, 60, 90, 120]; // minutos

// Los tres roles del sistema, con el valor exacto que envía el backend.
// Analista: registra candidatos y crea solicitudes. Evaluador: gestiona las solicitudes que tiene asignadas.
// Administrador: crea usuarios y asigna roles.
export const ROLES = {
  ANALISTA: 'ANALISTA_RECLUTAMIENTO',
  EVALUADOR: 'PROFESIONAL_EVALUADOR',
  ADMIN: 'ADMINISTRADOR',
};

export const ETIQUETA_ROL = {
  ANALISTA_RECLUTAMIENTO: 'Analista de Reclutamiento',
  PROFESIONAL_EVALUADOR: 'Profesional Evaluador',
  ADMINISTRADOR: 'Administrador',
};

// Categorías del historial de acciones (pantalla del administrador). Clave = valor que envía el backend.
export const CATEGORIAS_ACCION = {
  CUENTA: { etiqueta: 'Cuenta', bg: '#e2e3e5', text: '#41464b' },
  ADMINISTRACION: { etiqueta: 'Administración', bg: '#e0cffc', text: '#3d0a91' },
  CANDIDATOS: { etiqueta: 'Candidatos', bg: '#cfe2ff', text: '#084298' },
  SOLICITUDES: { etiqueta: 'Solicitudes', bg: '#d1e7dd', text: '#0f5132' },
  ENTREVISTAS: { etiqueta: 'Entrevistas', bg: '#fff3cd', text: '#664d03' },
  PAUSAS_Y_CANCELACIONES: { etiqueta: 'Pausas y cancelaciones', bg: '#f8d7da', text: '#842029' },
};

// Primera pantalla al entrar: el dashboard, que muestra a cada rol sus accesos e indicadores.
export function rutaInicio() {
  return '/dashboard';
}

// Solo el evaluador responsable cambia el estado y sube el informe.
export const ROLES_CAMBIAN_ESTADO = [ROLES.EVALUADOR];

export const ETIQUETA_RESULTADO = {
  RECOMENDADO: 'Recomendado',
  RECOMENDADO_CON_OBSERVACIONES: 'Recomendado con observaciones',
  NO_RECOMENDADO: 'No recomendado',
};
