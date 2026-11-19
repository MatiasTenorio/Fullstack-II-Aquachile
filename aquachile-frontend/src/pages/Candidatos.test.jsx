import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Candidatos from './Candidatos';
import { ApiError } from '../services/api';

const { auth } = vi.hoisted(() => ({ auth: { api: vi.fn() } }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => auth }));

const candidatos = [
  { id: 1, nombre: 'Ana Pérez', correo: 'ana@correo.cl', telefono: '+56 9 1111 1111' },
  { id: 2, nombre: 'Luis Soto', correo: null, telefono: null },
];

function renderPagina() {
  return render(
    <MemoryRouter>
      <Candidatos />
    </MemoryRouter>
  );
}

describe('Candidatos', () => {
  beforeEach(() => {
    auth.api.mockReset();
    auth.api.mockImplementation(async (ruta, opciones) => (opciones?.method ? {} : candidatos));
  });

  it('lista los candidatos registrados', async () => {
    // Candidatos
    // Muestra nombre, correo y el enlace para crear su solicitud
    renderPagina();
    expect(await screen.findByText('Ana Pérez')).toBeInTheDocument();
    expect(screen.getByText('ana@correo.cl')).toBeInTheDocument();
    expect(screen.getByText('Luis Soto')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Crear solicitud' })[0]).toHaveAttribute('href', '/solicitudes/nueva?candidato=1');
  });

  it('exige el nombre al registrar', async () => {
    // Candidatos
    // Muestra "Este campo es obligatorio" y no llama al backend
    const user = userEvent.setup();
    renderPagina();
    await screen.findByText('Ana Pérez');
    await user.click(screen.getByRole('button', { name: 'Registrar candidato' }));
    expect(screen.getByText('Este campo es obligatorio')).toBeInTheDocument();
    expect(auth.api).not.toHaveBeenCalledWith('/candidatos', expect.objectContaining({ method: 'POST' }));
  });

  it('registra un candidato nuevo', async () => {
    // Candidatos
    // Envía POST /candidatos y muestra "Candidato registrado."
    const user = userEvent.setup();
    renderPagina();
    await screen.findByText('Ana Pérez');
    await user.type(screen.getByLabelText(/nombre completo/i), 'Carla Díaz');
    await user.type(screen.getByLabelText(/correo electrónico/i), 'carla@correo.cl');
    await user.click(screen.getByRole('button', { name: 'Registrar candidato' }));
    expect(auth.api).toHaveBeenCalledWith('/candidatos', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ nombre: 'Carla Díaz', correo: 'carla@correo.cl', telefono: '' }),
    }));
    expect(await screen.findByText('Candidato registrado.')).toBeInTheDocument();
  });

  it('edita un candidato existente', async () => {
    // Candidatos
    // "Editar" carga sus datos en el formulario y guarda con PUT /candidatos/1
    const user = userEvent.setup();
    renderPagina();
    await screen.findByText('Ana Pérez');
    await user.click(screen.getAllByRole('button', { name: 'Editar' })[0]);
    expect(screen.getByLabelText(/nombre completo/i)).toHaveValue('Ana Pérez');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(auth.api).toHaveBeenCalledWith('/candidatos/1', expect.objectContaining({ method: 'PUT' }));
  });

  it('avisa si el correo ya pertenece a otro candidato', async () => {
    // Candidatos
    // Muestra el mensaje 409 que devuelve el backend
    auth.api.mockImplementation(async (ruta, opciones) => {
      if (opciones?.method) throw new ApiError(409, 'Ya existe un candidato registrado con ese correo');
      return candidatos;
    });
    const user = userEvent.setup();
    renderPagina();
    await screen.findByText('Ana Pérez');
    await user.type(screen.getByLabelText(/nombre completo/i), 'Otra Ana');
    await user.type(screen.getByLabelText(/correo electrónico/i), 'ana@correo.cl');
    await user.click(screen.getByRole('button', { name: 'Registrar candidato' }));
    expect(await screen.findByText('Ya existe un candidato registrado con ese correo')).toBeInTheDocument();
  });
});
