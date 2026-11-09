import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HistorialSolicitudes from './HistorialSolicitudes';

const { auth } = vi.hoisted(() => ({ auth: { api: vi.fn(), descargar: vi.fn() } }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => auth }));

const solicitudes = [
  { id: 1, candidatoNombre: 'Ana Pérez', candidatoCorreo: 'ana@correo.cl', cargo: 'Líder Desarrollo Producción', familiaCargo: 'Profesional A', estado: 'PENDIENTE', cvDisponible: true },
  { id: 2, candidatoNombre: 'Luis Soto', candidatoCorreo: 'luis@correo.cl', cargo: 'Analista de Sistemas', familiaCargo: 'Profesional B C', estado: 'FINALIZADO', cvDisponible: false },
];

function renderWithRouter() {
  return render(
    <MemoryRouter initialEntries={['/solicitudes']}>
      <Routes>
        <Route path="/solicitudes" element={<HistorialSolicitudes />} />
        <Route path="/solicitudes/:id" element={<h1>Detalle</h1>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('HistorialSolicitudes', () => {
  beforeEach(() => auth.api.mockResolvedValue(solicitudes));

  it('lista las solicitudes con su estado', async () => {
    // HistorialSolicitudes
    // Muestra ambos candidatos y los estados Pendiente y Completo
    renderWithRouter();
    expect(await screen.findByText('Ana Pérez')).toBeInTheDocument();
    expect(screen.getByText('Luis Soto')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
    expect(screen.getByText('Completo')).toBeInTheDocument();
  });

  it('muestra un mensaje si no hay resultados', async () => {
    // HistorialSolicitudes
    // Aparece "No se encontraron solicitudes"
    auth.api.mockResolvedValue([]);
    renderWithRouter();
    expect(await screen.findByText(/no se encontraron solicitudes/i)).toBeInTheDocument();
  });

  it('filtra por búsqueda en el backend', async () => {
    // HistorialSolicitudes
    // Consulta /solicitudes?busqueda=ana
    const user = userEvent.setup();
    renderWithRouter();
    await user.type(screen.getByPlaceholderText(/buscar por nombre/i), 'ana');
    await waitFor(() => expect(auth.api).toHaveBeenCalledWith('/solicitudes?busqueda=ana'));
  });

  it('abre el detalle al hacer click en una fila', async () => {
    // HistorialSolicitudes
    // Navega a /solicitudes/1
    const user = userEvent.setup();
    renderWithRouter();
    await user.click(await screen.findByText('Ana Pérez'));
    expect(screen.getByRole('heading', { name: 'Detalle' })).toBeInTheDocument();
  });
});
