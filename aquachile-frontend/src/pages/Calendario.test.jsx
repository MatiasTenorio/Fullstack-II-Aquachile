import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Calendario from './Calendario';
import { redirigir } from '../utils/navegador';

const { auth } = vi.hoisted(() => ({ auth: { api: vi.fn(), usuarioActual: null } }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => auth }));
vi.mock('../utils/navegador', () => ({ redirigir: vi.fn() }));

// "Hoy" queda fijo en el 16 de noviembre de 2026 para que el mes mostrado no dependa de cuándo se ejecute la prueba.
const HOY = new Date(2026, 10, 16, 10, 0);
const entrevista = {
  id: 9, solicitudId: 5, candidatoNombre: 'Ana Pérez', cargo: 'Gruero', evaluadorNombre: 'Evaluador Prueba',
  inicio: new Date(2026, 10, 19, 15, 0).toISOString(), fin: new Date(2026, 10, 19, 16, 0).toISOString(),
  modalidad: 'ONLINE', ubicacion: 'https://meet.ejemplo.test/abc', estado: 'AGENDADA',
};
const solicitudes = [
  { id: 7, candidatoNombre: 'Luis Soto', cargo: 'Gruero', estado: 'PENDIENTE', entrevistaInicio: null },
  { id: 5, candidatoNombre: 'Ana Pérez', cargo: 'Gruero', estado: 'EN_PROCESO', entrevistaInicio: entrevista.inicio },
];

// Estado de Google Calendar que devuelve el backend simulado; cada prueba lo puede cambiar.
let estadoGoogle;

function renderPagina(ruta = '/calendario') {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Calendario />
    </MemoryRouter>
  );
}

describe('Calendario', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'], now: HOY });
    auth.usuarioActual = { rol: 'PROFESIONAL_EVALUADOR' };
    auth.api.mockReset();
    estadoGoogle = { habilitado: false, conectado: false, googleEmail: null };
    redirigir.mockReset();
    auth.api.mockImplementation(async (ruta, opciones) => {
      if (ruta === '/google/calendar/estado') return estadoGoogle;
      if (ruta === '/google/calendar/autorizacion') return { url: 'https://accounts.google.com/o/oauth2/v2/auth?x=1' };
      if (ruta === '/google/calendar/conexion') return { habilitado: true, conectado: false, googleEmail: null };
      if (opciones?.method === 'POST') return {};
      return ruta.startsWith('/entrevistas') ? [entrevista] : solicitudes;
    });
  });
  afterEach(() => vi.useRealTimers());

  it('muestra el mes actual con sus entrevistas', async () => {
    // Calendario
    // Título "noviembre de 2026", consulta el rango de la grilla y pinta la entrevista en su día
    renderPagina();
    expect(screen.getByRole('heading', { name: /noviembre de 2026/i })).toBeInTheDocument();
    expect(await screen.findByText(/15:00 Ana Pérez/)).toBeInTheDocument();
    const consulta = auth.api.mock.calls.find(([ruta]) => ruta.startsWith('/entrevistas'))[0];
    // La grilla de noviembre de 2026 va del lunes 26 de octubre al domingo 6 de diciembre
    expect(consulta).toContain(`desde=${new Date(2026, 9, 26).toISOString()}`);
    expect(consulta).toContain(`hasta=${new Date(2026, 11, 7).toISOString()}`);
  });

  it('muestra el detalle del día seleccionado', async () => {
    // Calendario
    // Al elegir el 19 aparecen hora, modalidad y el enlace a la solicitud
    const user = userEvent.setup();
    renderPagina();
    await screen.findByText(/15:00 Ana Pérez/);
    await user.click(screen.getByRole('button', { name: /^19 de noviembre/ }));
    expect(screen.getByText('15:00 a 16:00')).toBeInTheDocument();
    expect(screen.getByText(/Online · https:\/\/meet\.ejemplo\.test\/abc/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver solicitud' })).toHaveAttribute('href', '/solicitudes/5');
  });

  it('cambia de mes y vuelve a consultar', async () => {
    // Calendario
    // "Mes siguiente" muestra diciembre y pide las entrevistas de ese rango
    const user = userEvent.setup();
    renderPagina();
    await screen.findByText(/15:00 Ana Pérez/);
    await user.click(screen.getByRole('button', { name: 'Mes siguiente' }));
    expect(screen.getByRole('heading', { name: /diciembre de 2026/i })).toBeInTheDocument();
    await waitFor(() => expect(
      auth.api.mock.calls.some(([ruta]) => ruta.includes(`desde=${new Date(2026, 10, 30).toISOString()}`))
    ).toBe(true));
  });

  it('deja al evaluador agendar desde un día, solo con solicitudes sin entrevista', async () => {
    // Calendario
    // En el día 20 ofrece solo a Luis Soto (Ana ya tiene entrevista) y envía POST con la fecha de ese día
    const user = userEvent.setup();
    renderPagina();
    await screen.findByText(/15:00 Ana Pérez/);
    await user.click(screen.getByRole('button', { name: /^20 de noviembre/ }));
    await user.click(screen.getByRole('button', { name: /Agendar entrevista este día/ }));
    expect(screen.getByRole('option', { name: /Luis Soto/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Ana Pérez/ })).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Solicitud'), '7');
    expect(screen.getByLabelText('Fecha y hora')).toHaveValue('2026-11-20T09:00');
    fireEvent.change(screen.getByLabelText('Fecha y hora'), { target: { value: '2026-11-20T11:30' } });
    await user.click(screen.getByRole('button', { name: 'Agendar' }));
    const llamada = auth.api.mock.calls.find(([ruta, opciones]) => opciones?.method === 'POST');
    expect(llamada[0]).toBe('/solicitudes/7/entrevistas');
    expect(JSON.parse(llamada[1].body).inicio).toBe(new Date(2026, 10, 20, 11, 30).toISOString());
    expect(await screen.findByText('Entrevista agendada.')).toBeInTheDocument();
  });

  it('no deja agendar en un día que ya pasó', async () => {
    // Calendario
    // En el día 10 (anterior a hoy) no aparece el botón de agendar
    const user = userEvent.setup();
    renderPagina();
    await screen.findByText(/15:00 Ana Pérez/);
    await user.click(screen.getByRole('button', { name: /^10 de noviembre/ }));
    expect(screen.queryByRole('button', { name: /Agendar entrevista este día/ })).not.toBeInTheDocument();
  });

  it('no muestra nada de Google si el servidor no lo tiene configurado', async () => {
    // Calendario
    // Con habilitado=false no aparece la tarjeta de Google Calendar
    renderPagina();
    await screen.findByText(/15:00 Ana Pérez/);
    expect(screen.queryByRole('button', { name: 'Conectar Google Calendar' })).not.toBeInTheDocument();
  });

  it('lleva al evaluador a Google para conectar su cuenta', async () => {
    // Calendario
    // Pide la dirección de autorización y redirige el navegador a ella
    estadoGoogle = { habilitado: true, conectado: false, googleEmail: null };
    const user = userEvent.setup();
    renderPagina();
    await user.click(await screen.findByRole('button', { name: 'Conectar Google Calendar' }));
    expect(auth.api).toHaveBeenCalledWith('/google/calendar/autorizacion', { method: 'POST' });
    await waitFor(() => expect(redirigir).toHaveBeenCalledWith('https://accounts.google.com/o/oauth2/v2/auth?x=1'));
  });

  it('muestra el resultado al volver desde Google', async () => {
    // Calendario
    // Con ?google=conectado muestra el aviso y la cuenta conectada
    estadoGoogle = { habilitado: true, conectado: true, googleEmail: 'evaluador.demo@gmail.test' };
    renderPagina('/calendario?google=conectado');
    expect(await screen.findByText(/Tu cuenta de Google quedó conectada/)).toBeInTheDocument();
    expect(await screen.findByText('evaluador.demo@gmail.test')).toBeInTheDocument();
  });

  it('deja desconectar la cuenta de Google', async () => {
    // Calendario
    // Envía DELETE /google/calendar/conexion y vuelve a ofrecer conectar
    estadoGoogle = { habilitado: true, conectado: true, googleEmail: 'evaluador.demo@gmail.test' };
    const user = userEvent.setup();
    renderPagina();
    await user.click(await screen.findByRole('button', { name: 'Desconectar' }));
    expect(auth.api).toHaveBeenCalledWith('/google/calendar/conexion', { method: 'DELETE' });
    expect(await screen.findByRole('button', { name: 'Conectar Google Calendar' })).toBeInTheDocument();
  });

  it('ofrece enviar a Google una entrevista agendada que no está sincronizada', async () => {
    // Calendario
    // Con la cuenta conectada y enGoogleCalendar=false aparece "Enviar a Google Calendar" y envía POST .../google
    estadoGoogle = { habilitado: true, conectado: true, googleEmail: 'evaluador.demo@gmail.test' };
    const user = userEvent.setup();
    renderPagina();
    await screen.findByText(/15:00 Ana Pérez/);
    await user.click(screen.getByRole('button', { name: /^19 de noviembre/ }));
    await user.click(await screen.findByRole('button', { name: 'Enviar a Google Calendar' }));
    expect(auth.api).toHaveBeenCalledWith('/solicitudes/5/entrevistas/9/google', { method: 'POST' });
    expect(await screen.findByText('Entrevista enviada a Google Calendar.')).toBeInTheDocument();
  });

  it('muestra al analista el evaluador de cada entrevista y no le deja agendar', async () => {
    // Calendario
    // El analista ve "Evaluador: ..." y no tiene botón de agendar
    auth.usuarioActual = { rol: 'ANALISTA_RECLUTAMIENTO' };
    const user = userEvent.setup();
    renderPagina();
    await screen.findByText(/15:00 Ana Pérez/);
    await user.click(screen.getByRole('button', { name: /^19 de noviembre/ }));
    expect(screen.getByText('Evaluador: Evaluador Prueba')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Agendar entrevista este día/ })).not.toBeInTheDocument();
    expect(auth.api).not.toHaveBeenCalledWith('/solicitudes');
    expect(auth.api).not.toHaveBeenCalledWith('/google/calendar/estado');
  });
});
