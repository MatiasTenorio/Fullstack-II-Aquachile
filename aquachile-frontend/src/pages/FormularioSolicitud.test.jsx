import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FormularioSolicitud from './FormularioSolicitud';

const { auth } = vi.hoisted(() => ({ auth: { api: vi.fn() } }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => auth }));

const candidatos = [{ id: 1, nombre: 'Ana Pérez', correo: 'ana@correo.cl' }];
const evaluadores = [{ id: 2, nombre: 'Evaluador Prueba' }];

function renderWithRouter(ruta = '/solicitudes/nueva') {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/solicitudes/nueva" element={<FormularioSolicitud />} />
        <Route path="/solicitudes/:id" element={<h1>Detalle</h1>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('FormularioSolicitud', () => {
  beforeEach(() => {
    auth.api.mockReset();
    auth.api.mockImplementation(async (ruta, opciones) => {
      if (opciones?.method === 'POST') return { id: 7 };
      return ruta === '/candidatos' ? candidatos : evaluadores;
    });
  });

  it('muestra errores si se envía vacío', async () => {
    // FormularioSolicitud
    // Aparecen los mensajes de candidato, evaluador y CV faltantes, y no se llama al backend
    const user = userEvent.setup();
    renderWithRouter();
    await screen.findByRole('option', { name: /Ana Pérez/ });
    await user.click(screen.getByRole('button', { name: 'Crear solicitud' }));
    expect(screen.getByText('Selecciona un candidato')).toBeInTheDocument();
    expect(screen.getByText('Selecciona el evaluador responsable')).toBeInTheDocument();
    expect(screen.getByText('Debes adjuntar el CV del candidato')).toBeInTheDocument();
    expect(auth.api).not.toHaveBeenCalledWith('/solicitudes', expect.anything());
  });

  it('muestra solo los cargos de la familia elegida', async () => {
    // FormularioSolicitud
    // El cargo parte deshabilitado y luego lista solo los cargos de la familia
    const user = userEvent.setup();
    renderWithRouter();
    expect(screen.getByLabelText(/nombre del cargo/i)).toBeDisabled();
    await user.selectOptions(screen.getByLabelText(/familia de cargo/i), 'Jefatura');
    expect(screen.getByRole('option', { name: 'Jefe de SSO' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Gruero' })).not.toBeInTheDocument();
  });

  it('rechaza un CV con formato inválido', async () => {
    // FormularioSolicitud
    // Muestra "El CV debe ser un archivo PDF, DOC o DOCX"
    const user = userEvent.setup({ applyAccept: false });
    renderWithRouter();
    await user.upload(screen.getByLabelText(/cv del candidato/i), new File(['x'], 'cv.txt'));
    await user.click(screen.getByRole('button', { name: 'Crear solicitud' }));
    expect(screen.getByText('El CV debe ser un archivo PDF, DOC o DOCX')).toBeInTheDocument();
  });

  it('preselecciona al candidato que llega en la URL', async () => {
    // FormularioSolicitud
    // Con ?candidato=1 el selector queda en Ana Pérez
    renderWithRouter('/solicitudes/nueva?candidato=1');
    await screen.findByRole('option', { name: /Ana Pérez/ });
    expect(screen.getByLabelText(/^candidato/i)).toHaveValue('1');
  });

  it('crea la solicitud con candidato, evaluador y CV, y abre su detalle', async () => {
    // FormularioSolicitud
    // Envía POST /solicitudes con los datos y navega a /solicitudes/7
    const user = userEvent.setup();
    renderWithRouter();
    await screen.findByRole('option', { name: /Ana Pérez/ });
    await user.selectOptions(screen.getByLabelText(/^candidato/i), '1');
    await user.selectOptions(screen.getByLabelText(/familia de cargo/i), 'Profesional A');
    await user.selectOptions(screen.getByLabelText(/nombre del cargo/i), 'Líder Desarrollo Producción');
    await user.selectOptions(screen.getByLabelText(/evaluador responsable/i), '2');
    await user.upload(screen.getByLabelText(/cv del candidato/i), new File(['x'], 'cv.pdf', { type: 'application/pdf' }));
    await user.click(screen.getByRole('button', { name: 'Crear solicitud' }));

    const llamada = auth.api.mock.calls.find(([ruta, opciones]) => ruta === '/solicitudes' && opciones?.method === 'POST');
    expect(llamada).toBeDefined();
    const datos = llamada[1].body;
    expect(datos.get('candidatoId')).toBe('1');
    expect(datos.get('responsableId')).toBe('2');
    expect(datos.get('cargo')).toBe('Líder Desarrollo Producción');
    expect(datos.get('familiaCargo')).toBe('Profesional A');
    expect(datos.get('cv').name).toBe('cv.pdf');
    expect(await screen.findByRole('heading', { name: 'Detalle' })).toBeInTheDocument();
  });
});
