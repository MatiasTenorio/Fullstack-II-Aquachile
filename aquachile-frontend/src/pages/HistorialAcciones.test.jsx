import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HistorialAcciones from './HistorialAcciones';

const { auth } = vi.hoisted(() => ({ auth: { api: vi.fn() } }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => auth }));

const usuarios = [
  { id: 1, nombre: 'Analista Prueba', email: 'analista@aquachile.test', rol: 'ANALISTA_RECLUTAMIENTO', activo: true, ultimaActividad: '2026-11-19T15:00:00Z' },
  { id: 2, nombre: 'Evaluador Prueba', email: 'evaluador@aquachile.test', rol: 'PROFESIONAL_EVALUADOR', activo: true, ultimaActividad: null },
  { id: 4, nombre: 'Cuenta Antigua', email: 'antigua@aquachile.test', rol: 'ANALISTA_RECLUTAMIENTO', activo: false, ultimaActividad: null },
];

const accion = (id, extra) => ({
  id, tipo: 'SESION_INICIADA', categoria: 'CUENTA', descripcion: `Acción ${id}`, motivo: null,
  solicitudId: null, fecha: '2026-11-19T15:00:00Z', ...extra,
});

function historial(acciones, extra = {}) {
  return { usuario: usuarios[1], acciones, pagina: 0, totalPaginas: 1, total: acciones.length, ...extra };
}

function renderEn(ruta) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/acciones" element={<HistorialAcciones />} />
        <Route path="/acciones/:usuarioId" element={<HistorialAcciones />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('HistorialAcciones', () => {
  beforeEach(() => {
    auth.api.mockReset();
    auth.api.mockImplementation(async (ruta) => {
      if (ruta === '/usuarios') return usuarios;
      return historial([
        accion(10, {
          tipo: 'SOLICITUD_PAUSADA', categoria: 'PAUSAS_Y_CANCELACIONES',
          descripcion: 'Pausó la solicitud #12 de Ana Pérez', motivo: 'El candidato pidió posponer', solicitudId: 12,
        }),
        accion(9, { descripcion: 'Inició sesión' }),
      ]);
    });
  });

  it('lista los usuarios activos e inactivos y pide elegir uno', async () => {
    // HistorialAcciones
    // Muestra los tres usuarios con su estado y el aviso para elegir; no pide ningún historial
    renderEn('/acciones');
    expect(await screen.findByText('Analista Prueba')).toBeInTheDocument();
    expect(screen.getByText('Cuenta Antigua')).toBeInTheDocument();
    expect(screen.getByText('Inactivo')).toBeInTheDocument();
    expect(screen.getAllByText('Sin actividad registrada')).toHaveLength(2);
    expect(screen.getByText(/Última actividad:/)).toBeInTheDocument();
    expect(screen.getByText(/Elige un usuario de la lista/)).toBeInTheDocument();
    expect(auth.api).toHaveBeenCalledTimes(1);
  });

  it('filtra la lista por estado y por texto', async () => {
    // HistorialAcciones
    // "Inactivos" deja solo la cuenta desactivada; la búsqueda filtra por nombre o correo
    const user = userEvent.setup();
    renderEn('/acciones');
    await screen.findByText('Analista Prueba');
    await user.selectOptions(screen.getByLabelText('Filtrar por estado de la cuenta'), 'inactivos');
    expect(screen.queryByText('Analista Prueba')).not.toBeInTheDocument();
    expect(screen.getByText('Cuenta Antigua')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Filtrar por estado de la cuenta'), 'todos');
    await user.type(screen.getByLabelText('Buscar usuario'), 'evaluador@');
    expect(screen.getByText('Evaluador Prueba')).toBeInTheDocument();
    expect(screen.queryByText('Analista Prueba')).not.toBeInTheDocument();
  });

  it('muestra el historial del usuario elegido con el motivo de la pausa', async () => {
    // HistorialAcciones
    // Al hacer clic pide /usuarios/2/acciones y muestra cada acción, su categoría y el motivo
    const user = userEvent.setup();
    renderEn('/acciones');
    await user.click(await screen.findByRole('button', { name: /Evaluador Prueba/ }));
    expect(auth.api).toHaveBeenCalledWith('/usuarios/2/acciones');
    expect(await screen.findByText('Pausó la solicitud #12 de Ana Pérez')).toBeInTheDocument();
    expect(screen.getByText('El candidato pidió posponer')).toBeInTheDocument();
    expect(screen.getByText('Solicitud #12')).toBeInTheDocument();
    expect(screen.getByText('Pausas y cancelaciones', { selector: '.badge' })).toBeInTheDocument();
    expect(screen.getByText('Inició sesión')).toBeInTheDocument();
  });

  it('filtra el historial por tipo de acción', async () => {
    // HistorialAcciones
    // Elegir una categoría vuelve a consultar con ?categoria=...
    const user = userEvent.setup();
    renderEn('/acciones/2');
    await screen.findByText('Pausó la solicitud #12 de Ana Pérez');
    await user.selectOptions(screen.getByLabelText('Filtrar por tipo de acción'), 'PAUSAS_Y_CANCELACIONES');
    await waitFor(() => expect(auth.api).toHaveBeenCalledWith('/usuarios/2/acciones?categoria=PAUSAS_Y_CANCELACIONES'));
  });

  it('carga la página siguiente al final de la lista', async () => {
    // HistorialAcciones
    // Con más de una página aparece "Cargar más acciones", que pide pagina=1 y agrega las acciones
    auth.api.mockImplementation(async (ruta) => {
      if (ruta === '/usuarios') return usuarios;
      if (ruta.includes('pagina=1')) return historial([accion(1, { descripcion: 'Acción antigua' })], { pagina: 1, totalPaginas: 2, total: 2 });
      return historial([accion(2, { descripcion: 'Acción reciente' })], { totalPaginas: 2, total: 2 });
    });
    const user = userEvent.setup();
    renderEn('/acciones/2');
    await user.click(await screen.findByRole('button', { name: 'Cargar más acciones' }));
    expect(await screen.findByText('Acción antigua')).toBeInTheDocument();
    expect(screen.getByText('Acción reciente')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cargar más acciones' })).not.toBeInTheDocument();
  });
});
