import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DetalleSolicitud from './DetalleSolicitud';

const { auth } = vi.hoisted(() => ({
  auth: { api: vi.fn(), descargar: vi.fn(), usuarioActual: { rol: 'PROFESIONAL_EVALUADOR' } },
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
  estadoPrevio: null,
  responsable: null,
  cvDisponible: true,
  informeDisponible: false,
  solicitudesDelCandidato: 1,
  entrevistas: [],
  historial: [],
};

const entrevistaFutura = {
  id: 9, inicio: '2030-01-10T13:00:00Z', fin: '2030-01-10T14:00:00Z',
  modalidad: 'ONLINE', ubicacion: 'https://meet.ejemplo.test/abc', estado: 'AGENDADA',
};
const entrevistaPasada = { ...entrevistaFutura, id: 8, inicio: '2020-01-10T13:00:00Z', fin: '2020-01-10T14:00:00Z' };

// La carga inicial devuelve "inicial"; cualquier cambio (POST, PUT, PATCH) devuelve "despues".
function simularApi(inicial, despues = inicial) {
  auth.api.mockImplementation(async (ruta, opciones) => (opciones?.method ? despues : inicial));
}

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
    auth.usuarioActual = { rol: 'PROFESIONAL_EVALUADOR' };
    auth.api.mockReset();
    auth.descargar.mockResolvedValue({ blob: new Blob(['x']), nombre: 'cv.pdf' });
    simularApi(solicitud);
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

  it('agenda la entrevista y la solicitud pasa a En Proceso', async () => {
    // DetalleSolicitud
    // Envía POST /solicitudes/5/entrevistas con fecha, duración y modalidad, y muestra "En Proceso"
    simularApi(solicitud, { ...solicitud, estado: 'EN_PROCESO', entrevistas: [entrevistaFutura] });
    const user = userEvent.setup();
    renderWithRouter();
    await user.click(await screen.findByRole('button', { name: 'Agendar entrevista' }));
    fireEvent.change(screen.getByLabelText('Fecha y hora'), { target: { value: '2030-01-10T10:00' } });
    await user.selectOptions(screen.getByLabelText('Duración'), '45');
    await user.type(screen.getByLabelText('Enlace de la reunión'), 'https://meet.ejemplo.test/abc');
    await user.click(screen.getByRole('button', { name: 'Agendar' }));

    const llamada = auth.api.mock.calls.find(([ruta]) => ruta === '/solicitudes/5/entrevistas');
    expect(llamada[1].method).toBe('POST');
    expect(JSON.parse(llamada[1].body)).toEqual({
      inicio: new Date('2030-01-10T10:00').toISOString(),
      duracionMinutos: 45,
      modalidad: 'ONLINE',
      ubicacion: 'https://meet.ejemplo.test/abc',
    });
    expect(await screen.findByText('En Proceso')).toBeInTheDocument();
    expect(screen.getByText('Agendada')).toBeInTheDocument();
  });

  it('no deja agendar una entrevista en el pasado', async () => {
    // DetalleSolicitud
    // Muestra el aviso y no llama al backend
    const user = userEvent.setup();
    renderWithRouter();
    await user.click(await screen.findByRole('button', { name: 'Agendar entrevista' }));
    fireEvent.change(screen.getByLabelText('Fecha y hora'), { target: { value: '2020-01-10T10:00' } });
    await user.click(screen.getByRole('button', { name: 'Agendar' }));
    expect(screen.getByText('La entrevista debe agendarse para una fecha y hora futuras')).toBeInTheDocument();
    expect(auth.api).not.toHaveBeenCalledWith('/solicitudes/5/entrevistas', expect.anything());
  });

  it('reprograma la entrevista agendada', async () => {
    // DetalleSolicitud
    // Envía PUT /solicitudes/5/entrevistas/9 con la nueva fecha
    simularApi({ ...solicitud, estado: 'EN_PROCESO', entrevistas: [entrevistaFutura] });
    const user = userEvent.setup();
    renderWithRouter();
    await user.click(await screen.findByRole('button', { name: 'Reprogramar' }));
    fireEvent.change(screen.getByLabelText('Fecha y hora'), { target: { value: '2030-02-01T09:30' } });
    await user.click(screen.getByRole('button', { name: 'Guardar nueva fecha' }));
    const llamada = auth.api.mock.calls.find(([ruta]) => ruta === '/solicitudes/5/entrevistas/9');
    expect(llamada[1].method).toBe('PUT');
    expect(JSON.parse(llamada[1].body).inicio).toBe(new Date('2030-02-01T09:30').toISOString());
  });

  it('solo ofrece marcar como realizada una entrevista que ya ocurrió', async () => {
    // DetalleSolicitud
    // Con entrevista futura no aparece el botón; con una pasada sí, y envía PATCH .../realizada
    simularApi({ ...solicitud, estado: 'EN_PROCESO', entrevistas: [entrevistaFutura] });
    const { unmount } = renderWithRouter();
    await screen.findByRole('button', { name: 'Reprogramar' });
    expect(screen.queryByRole('button', { name: 'Marcar como realizada' })).not.toBeInTheDocument();
    unmount();

    simularApi({ ...solicitud, estado: 'EN_PROCESO', entrevistas: [entrevistaPasada] });
    const user = userEvent.setup();
    renderWithRouter();
    await user.click(await screen.findByRole('button', { name: 'Marcar como realizada' }));
    expect(auth.api).toHaveBeenCalledWith('/solicitudes/5/entrevistas/8/realizada', { method: 'PATCH' });
  });

  it('muestra la entrevista realizada aunque haya una cancelada con fecha posterior', async () => {
    // DetalleSolicitud
    // La tarjeta muestra "Realizada"; la cancelada queda en "Entrevistas anteriores"
    simularApi({
      ...solicitud,
      estado: 'EN_PROCESO',
      entrevistas: [
        { ...entrevistaFutura, estado: 'CANCELADA' },
        { ...entrevistaPasada, estado: 'REALIZADA' },
      ],
    });
    renderWithRouter();
    expect(await screen.findByText('Realizada')).toBeInTheDocument();
    expect(screen.getByText(/Entrevistas anteriores:.*\(cancelada\)/)).toBeInTheDocument();
  });

  it('bloquea finalizar la solicitud sin informe', async () => {
    // DetalleSolicitud
    // Botón "Finalizar solicitud" deshabilitado y aviso de informe
    simularApi({ ...solicitud, estado: 'EN_PROCESO' });
    renderWithRouter();
    expect(await screen.findByRole('button', { name: 'Finalizar solicitud' })).toBeDisabled();
    expect(screen.getByText(/sube el informe del psicólogo/i)).toBeInTheDocument();
  });

  it('finaliza la solicitud cuando ya tiene informe', async () => {
    // DetalleSolicitud
    // Envía PATCH con FINALIZADO y muestra el estado "Completo"
    simularApi(
      { ...solicitud, estado: 'EN_PROCESO', informeDisponible: true },
      { ...solicitud, estado: 'FINALIZADO', informeDisponible: true }
    );
    const user = userEvent.setup();
    renderWithRouter();
    await user.click(await screen.findByRole('button', { name: 'Finalizar solicitud' }));
    expect(auth.api).toHaveBeenCalledWith('/solicitudes/5/estado', expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({ estado: 'FINALIZADO' }),
    }));
    expect(await screen.findByText('Completo')).toBeInTheDocument();
  });

  it('exige un motivo para pausar', async () => {
    // DetalleSolicitud
    // Sin motivo muestra "Escribe el motivo"; con motivo envía PATCH con EN_PAUSA
    const user = userEvent.setup();
    renderWithRouter();
    await user.click(await screen.findByRole('button', { name: 'Pausar' }));
    await user.click(screen.getByRole('button', { name: 'Pausar solicitud' }));
    expect(screen.getByText('Escribe el motivo')).toBeInTheDocument();
    expect(auth.api).not.toHaveBeenCalledWith('/solicitudes/5/estado', expect.anything());

    await user.type(screen.getByLabelText('Motivo'), 'Candidato de viaje');
    await user.click(screen.getByRole('button', { name: 'Pausar solicitud' }));
    expect(auth.api).toHaveBeenCalledWith('/solicitudes/5/estado', expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({ estado: 'EN_PAUSA', motivo: 'Candidato de viaje' }),
    }));
  });

  it('muestra el motivo de la pausa y reanuda al estado anterior', async () => {
    // DetalleSolicitud
    // En pausa: muestra el motivo y "Reanudar solicitud" envía el estado previo (EN_PROCESO)
    simularApi({
      ...solicitud,
      estado: 'EN_PAUSA',
      estadoPrevio: 'EN_PROCESO',
      historial: [{
        id: 1, estadoAnterior: 'EN_PROCESO', estadoNuevo: 'EN_PAUSA', comentario: 'Candidato de viaje',
        usuarioNombre: 'Evaluador Prueba', fecha: '2026-11-16T15:00:00Z',
      }],
    });
    const user = userEvent.setup();
    renderWithRouter();
    expect(await screen.findByText('Motivo: Candidato de viaje')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Agendar entrevista' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reanudar solicitud' }));
    expect(auth.api).toHaveBeenCalledWith('/solicitudes/5/estado', expect.objectContaining({
      body: JSON.stringify({ estado: 'EN_PROCESO' }),
    }));
  });

  it('cancela la solicitud con motivo', async () => {
    // DetalleSolicitud
    // Envía PATCH con CANCELADO y el motivo
    const user = userEvent.setup();
    renderWithRouter();
    await user.click(await screen.findByRole('button', { name: 'Cancelar solicitud' }));
    await user.type(screen.getByLabelText('Motivo'), 'El candidato desistió');
    // Ahora hay dos botones con ese nombre: el del pie (deshabilitado) y el del formulario
    const botones = screen.getAllByRole('button', { name: 'Cancelar solicitud' });
    await user.click(botones.find((boton) => boton.type === 'submit'));
    expect(auth.api).toHaveBeenCalledWith('/solicitudes/5/estado', expect.objectContaining({
      body: JSON.stringify({ estado: 'CANCELADO', motivo: 'El candidato desistió' }),
    }));
  });

  it('no ofrece acciones en una solicitud cancelada', async () => {
    // DetalleSolicitud
    // Cancelada: no se puede agendar, pausar, reanudar ni cancelar
    simularApi({ ...solicitud, estado: 'CANCELADO' });
    renderWithRouter();
    await screen.findByText('Ana Pérez');
    for (const nombre of ['Agendar entrevista', 'Pausar', 'Reanudar solicitud', 'Cancelar solicitud', 'Subir informe']) {
      expect(screen.queryByRole('button', { name: nombre })).not.toBeInTheDocument();
    }
  });

  it('muestra el historial de la solicitud', async () => {
    // DetalleSolicitud
    // Cada registro muestra quién hizo el cambio, el cambio de estado y el comentario
    simularApi({
      ...solicitud,
      estado: 'EN_PROCESO',
      historial: [
        { id: 2, estadoAnterior: 'PENDIENTE', estadoNuevo: 'EN_PROCESO', comentario: 'Entrevista agendada para el 10-01-2030 10:00', usuarioNombre: 'Evaluador Prueba', fecha: '2026-11-16T15:00:00Z' },
        { id: 1, estadoAnterior: null, estadoNuevo: 'PENDIENTE', comentario: 'Solicitud creada y asignada a Evaluador Prueba', usuarioNombre: 'Analista Prueba', fecha: '2026-11-16T14:00:00Z' },
      ],
    });
    renderWithRouter();
    expect(await screen.findByText('Pendiente → En Proceso')).toBeInTheDocument();
    expect(screen.getByText('Entrevista agendada para el 10-01-2030 10:00')).toBeInTheDocument();
    expect(screen.getByText('Solicitud creada y asignada a Evaluador Prueba')).toBeInTheDocument();
    expect(screen.getByText(/Analista Prueba/)).toBeInTheDocument();
  });

  it('no muestra las acciones del evaluador al analista', async () => {
    // DetalleSolicitud
    // El analista no agenda, no pausa, no cancela ni sube informe
    auth.usuarioActual = { rol: 'ANALISTA_RECLUTAMIENTO' };
    simularApi({ ...solicitud, estado: 'EN_PROCESO', entrevistas: [entrevistaFutura] });
    renderWithRouter();
    await screen.findByText('Ana Pérez');
    expect(screen.getByText('Agendada')).toBeInTheDocument(); // sí ve la entrevista
    for (const nombre of ['Reprogramar', 'Pausar', 'Cancelar solicitud', 'Subir informe', 'Finalizar solicitud']) {
      expect(screen.queryByRole('button', { name: nombre })).not.toBeInTheDocument();
    }
  });

  it('deja al analista asignar el evaluador responsable', async () => {
    // DetalleSolicitud
    // Envía PATCH /solicitudes/5 con responsableId y muestra al nuevo responsable
    auth.usuarioActual = { rol: 'ANALISTA_RECLUTAMIENTO' };
    const evaluador = { id: 2, nombre: 'Evaluador Prueba' };
    auth.api.mockImplementation(async (ruta, opciones) => {
      if (ruta === '/usuarios/evaluadores') return [evaluador];
      return opciones?.method === 'PATCH' ? { ...solicitud, responsable: evaluador } : solicitud;
    });
    const user = userEvent.setup();
    renderWithRouter();
    await user.selectOptions(await screen.findByLabelText(/asignar evaluador responsable/i), '2');
    await user.click(screen.getByRole('button', { name: 'Asignar' }));
    expect(auth.api).toHaveBeenCalledWith('/solicitudes/5', expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({ responsableId: 2 }),
    }));
    expect(await screen.findByText('Responsable: Evaluador Prueba')).toBeInTheDocument();
  });

  it('no deja al evaluador reasignar la solicitud', async () => {
    // DetalleSolicitud
    // El selector de evaluador no aparece para el evaluador
    renderWithRouter();
    await screen.findByText('Ana Pérez');
    expect(screen.queryByLabelText(/evaluador responsable/i)).not.toBeInTheDocument();
  });
});
