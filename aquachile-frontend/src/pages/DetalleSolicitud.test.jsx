import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DetalleSolicitud from './DetalleSolicitud';

const { auth } = vi.hoisted(() => ({
  auth: { api: vi.fn(), descargar: vi.fn(), usuarioActual: { rol: 'ANALISTA_RECLUTAMIENTO' } },
}));
vi.mock('../context/AuthContext', () => ({ useAuth: () => auth }));
vi.mock('../components/CvPreview', () => ({ default: () => <div>Vista previa del CV</div> }));

const solicitud = {
  id: 5,
  candidato: { nombre: 'Ana Pérez', correo: 'ana@correo.cl' },
  cargo: 'Líder Desarrollo Producción',
  familiaCargo: 'Profesional A',
  fechaSolicitud: '2026-11-09',
  estado: 'PENDIENTE',
  responsable: null,
  cvDisponible: true,
  informeDisponible: false,
  solicitudesDelCandidato: 1,
};

function renderWithRouter() {
  return render(
    <MemoryRouter initialEntries={['/solicitudes/5']}>
      <Routes>
        <Route path="/solicitudes/:id" element={<DetalleSolicitud />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('DetalleSolicitud', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:cv');
    URL.revokeObjectURL = vi.fn();
    auth.usuarioActual = { rol: 'ANALISTA_RECLUTAMIENTO' };
    auth.descargar.mockResolvedValue({ blob: new Blob(['x']), nombre: 'cv.pdf' });
    auth.api.mockImplementation(async (ruta, opciones) =>
      opciones?.method === 'PATCH' ? { ...solicitud, estado: 'EN_PROCESO' } : solicitud
    );
  });

  it('muestra los datos del candidato y la solicitud', async () => {
    // DetalleSolicitud
    // Aparecen nombre, correo, cargo y vista previa del CV
    renderWithRouter();
    expect(await screen.findByText('Ana Pérez')).toBeInTheDocument();
    expect(screen.getByText('ana@correo.cl')).toBeInTheDocument();
    expect(screen.getByText('Cargo: Líder Desarrollo Producción')).toBeInTheDocument();
    expect(await screen.findByText('Vista previa del CV')).toBeInTheDocument();
  });

  it('actualiza el estado al hacer click', async () => {
    // DetalleSolicitud
    // Envía PATCH con EN_PROCESO y muestra el estado "En Proceso"
    const user = userEvent.setup();
    renderWithRouter();
    await user.click(await screen.findByRole('button', { name: 'Actualizar Estado' }));
    expect(auth.api).toHaveBeenCalledWith('/solicitudes/5/estado', expect.objectContaining({ method: 'PATCH' }));
    expect(await screen.findByText('En Proceso')).toBeInTheDocument();
  });

  it('bloquea completar la solicitud sin informe', async () => {
    // DetalleSolicitud
    // Botón "Actualizar Estado" deshabilitado y aviso de informe
    auth.api.mockResolvedValue({ ...solicitud, estado: 'EN_PROCESO' });
    renderWithRouter();
    expect(await screen.findByRole('button', { name: 'Actualizar Estado' })).toBeDisabled();
    expect(screen.getByText(/sube el informe del psicólogo/i)).toBeInTheDocument();
  });

  it('no muestra acciones a Jefatura', async () => {
    // DetalleSolicitud
    // No aparecen "Actualizar Estado" ni "Subir informe"
    auth.usuarioActual = { rol: 'JEFATURA' };
    renderWithRouter();
    await screen.findByText('Ana Pérez');
    expect(screen.queryByRole('button', { name: 'Actualizar Estado' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Subir informe' })).not.toBeInTheDocument();
  });
});
