export const ESTADOS = ['Pendiente', 'En Proceso', 'Completo'];

const cvPdf = { url: '/cvs/cv-ejemplo.pdf', nombreArchivo: 'cv-ejemplo.pdf' };
const cvWord = { url: '/cvs/cv-ejemplo.docx', nombreArchivo: 'cv-ejemplo.docx' };

export const solicitudesMock = [
  { id: 1, nombre: 'Pedro Guillermo Alfarino Ojeda', email: 'ped.guillermo@ejemplo.cl', cargo: 'Desarrollador Frontend', familiaCargo: 'Familia de Cargo A', estado: 'Pendiente', cv: cvPdf },
  { id: 2, nombre: 'Martina Alfredo Manuel Silva', email: 'mar.alfredo@ejemplo.cl', cargo: 'Analista de Datos', familiaCargo: 'Familia de Cargo B', estado: 'En Proceso', cv: cvWord },
  { id: 3, nombre: 'Luisa Gallardo Socorro Amanda', email: 'lui.gallardo@ejemplo.cl', cargo: 'Diseñador UX/UI', familiaCargo: 'Familia de Cargo A', estado: 'Completo', cv: cvPdf },
  { id: 4, nombre: 'Victoria Allasgo Amanda Vega', email: 'vic.allasgo@ejemplo.cl', cargo: 'Gerente de Proyecto', familiaCargo: 'Familia de Cargo C', estado: 'En Proceso', cv: cvWord },
  { id: 5, nombre: 'Samuel Diego Alejandro Negron', email: 'sam.diego@ejemplo.cl', cargo: 'Ingeniería de Software', familiaCargo: 'Familia de Cargo B', estado: 'Completo', cv: cvPdf },
  { id: 6, nombre: 'Fernanda Aguilar Contreras Núñez', email: 'fer.aguilar@ejemplo.cl', cargo: 'Analista de Marketing', familiaCargo: 'Familia de Cargo C', estado: 'Pendiente', cv: cvWord },
];