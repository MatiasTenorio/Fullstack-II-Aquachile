import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Dashboard from './Dashboard';

const { auth } = vi.hoisted(() => ({ auth: { api: vi.fn(), usuarioActual: null } }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => auth }));

const porEstado = { PENDIENTE: 4, EN_PROCESO: 2, EN_PAUSA: 1, CANCELADO: 0, FINALIZADO: 7 };
const entrevista = {
  id: 9, solicitudId: 5, candidatoNombre: 'Ana Pérez', cargo: 'Gruero', evaluadorNombre: 'Evaluador Prueba',
  inicio: '2030-01-10T13:00:00Z', fin: '2030-01-10T14:00:00Z', modalidad: 'ONLINE', estado: 'AGENDADA',
};

function renderPagina() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );
}

describe('Dashboard', () => {
  beforeEach(() => auth.api.mockReset());

  it('muestra al analista sus accesos, los contadores y las próximas entrevistas', async () => {
    // Dashboard
    // Accesos de analista, contador por estado con enlace al listado filtrado y entrevista con su evaluador
    auth.usuarioActual = { nombre: 'Analista Prueba', rol: 'ANALISTA_RECLUTAMIENTO' };
    auth.api.mockResolvedValue({
      solicitudesPorEstado: porEstado, totalCandidatos: 12, solicitudesSinAsignar: 3, proximasEntrevistas: [entrevista],
    });
    renderPagina();
    expect(screen.getByText('Hola, Analista Prueba')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Nueva solicitud/ })).toHaveAttribute('href', '/solicitudes/nueva');
    expect(screen.getByRole('link', { name: /Registrar candidato/ })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Pendiente: 4' })).toHaveAttribute('href', '/solicitudes?estado=PENDIENTE');
    expect(screen.getByRole('link', { name: 'En pausa: 1' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Candidatos registrados: 12' })).toBeInTheDocument();
    expect(screen.getByText('Solicitudes abiertas sin evaluador')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ana Pérez/ })).toHaveAttribute('href', '/solicitudes/5');
    expect(screen.getByText(/Evaluador Prueba/)).toBeInTheDocument();
  });

  it('muestra al evaluador sus propios indicadores', async () => {
    // Dashboard
    // Accesos de evaluador y contador de solicitudes sin informe; no ve accesos del analista
    auth.usuarioActual = { nombre: 'Evaluador Prueba', rol: 'PROFESIONAL_EVALUADOR' };
    auth.api.mockResolvedValue({ solicitudesPorEstado: porEstado, solicitudesSinInforme: 2, proximasEntrevistas: [] });
    renderPagina();
    expect(screen.getByRole('link', { name: /Por agendar/ })).toHaveAttribute('href', '/solicitudes?estado=PENDIENTE');
    expect(screen.queryByRole('link', { name: /Nueva solicitud/ })).not.toBeInTheDocument();
    expect(await screen.findByText('Mis solicitudes por estado')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'En proceso sin informe: 2' })).toBeInTheDocument();
    expect(screen.getByText('No hay entrevistas agendadas.')).toBeInTheDocument();
  });

  it('muestra al administrador las cuentas por rol', async () => {
    // Dashboard
    // Acceso a Usuarios y contadores de cuentas; no hay contadores de solicitudes
    auth.usuarioActual = { nombre: 'Admin Prueba', rol: 'ADMINISTRADOR' };
    auth.api.mockResolvedValue({
      usuariosPorRol: { ANALISTA_RECLUTAMIENTO: 2, PROFESIONAL_EVALUADOR: 3, ADMINISTRADOR: 1 }, usuariosInactivos: 1,
    });
    renderPagina();
    expect(screen.getByRole('link', { name: /Usuarios/ })).toHaveAttribute('href', '/usuarios');
    expect(await screen.findByText('Profesional Evaluador (activos)')).toBeInTheDocument();
    expect(screen.getByText('Cuentas inactivas')).toBeInTheDocument();
    expect(screen.queryByText('Solicitudes por estado')).not.toBeInTheDocument();
  });
});
