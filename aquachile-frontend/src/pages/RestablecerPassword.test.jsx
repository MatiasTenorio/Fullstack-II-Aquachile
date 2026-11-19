import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RestablecerPassword from './RestablecerPassword';
import { ApiError, apiFetch } from '../services/api';

vi.mock('../services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  apiFetch: vi.fn(),
}));

function renderPagina() {
  return render(
    <MemoryRouter>
      <RestablecerPassword />
    </MemoryRouter>
  );
}

// Completa el paso 1 y deja la pantalla en el paso del código.
async function llegarAlCodigo(user) {
  apiFetch.mockResolvedValueOnce({ mensaje: 'Si el correo pertenece a una cuenta activa, te enviamos un código.' });
  await user.type(screen.getByLabelText('Correo'), 'analista@aquachile.test');
  await user.click(screen.getByRole('button', { name: 'Enviar código' }));
  await screen.findByLabelText('Código');
}

describe('RestablecerPassword', () => {
  beforeEach(() => apiFetch.mockReset());

  it('exige un correo válido antes de pedir el código', async () => {
    // RestablecerPassword
    // Muestra "Ingresa un correo válido" y no llama al backend
    const user = userEvent.setup();
    renderPagina();
    await user.type(screen.getByLabelText('Correo'), 'no-es-correo');
    await user.click(screen.getByRole('button', { name: 'Enviar código' }));
    expect(screen.getByText('Ingresa un correo válido')).toBeInTheDocument();
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('pide el código y pasa al segundo paso', async () => {
    // RestablecerPassword
    // Envía POST /auth/password/codigo con el correo y muestra el mensaje del backend
    const user = userEvent.setup();
    renderPagina();
    await llegarAlCodigo(user);
    expect(apiFetch).toHaveBeenCalledWith('/auth/password/codigo', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ email: 'analista@aquachile.test' }),
    }));
    expect(screen.getByText(/te enviamos un código/)).toBeInTheDocument();
  });

  it('valida el código y la contraseña antes de enviar', async () => {
    // RestablecerPassword
    // Código incompleto, contraseña débil y luego contraseñas distintas: no se llama al backend
    const user = userEvent.setup();
    renderPagina();
    await llegarAlCodigo(user);
    await user.type(screen.getByLabelText('Código'), '123');
    await user.type(screen.getByLabelText('Nueva contraseña'), 'corta');
    await user.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));
    expect(screen.getByText('El código tiene 6 dígitos')).toBeInTheDocument();
    expect(screen.getByText('La contraseña debe tener entre 8 y 72 caracteres')).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Nueva contraseña'));
    await user.type(screen.getByLabelText('Nueva contraseña'), 'Nueva2026!');
    await user.type(screen.getByLabelText('Repite la contraseña'), 'Distinta2026!');
    await user.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));
    expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument();
    expect(apiFetch).toHaveBeenCalledTimes(1); // solo la petición del código
  });

  it('cambia la contraseña con el código correcto', async () => {
    // RestablecerPassword
    // Envía POST /auth/password/restablecer y muestra la confirmación con el enlace al login
    const user = userEvent.setup();
    renderPagina();
    await llegarAlCodigo(user);
    apiFetch.mockResolvedValueOnce({ mensaje: 'ok' });
    await user.type(screen.getByLabelText('Código'), '123456');
    await user.type(screen.getByLabelText('Nueva contraseña'), 'Nueva2026!');
    await user.type(screen.getByLabelText('Repite la contraseña'), 'Nueva2026!');
    await user.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));
    expect(apiFetch).toHaveBeenLastCalledWith('/auth/password/restablecer', expect.objectContaining({
      body: JSON.stringify({ email: 'analista@aquachile.test', codigo: '123456', nuevaPassword: 'Nueva2026!' }),
    }));
    expect(await screen.findByText(/Ya puedes iniciar sesión/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir a iniciar sesión' })).toHaveAttribute('href', '/login');
  });

  it('muestra el error si el código es incorrecto', async () => {
    // RestablecerPassword
    // Muestra el mensaje del backend y se queda en el paso del código
    const user = userEvent.setup();
    renderPagina();
    await llegarAlCodigo(user);
    apiFetch.mockRejectedValueOnce(new ApiError(400, 'El codigo es incorrecto o ya vencio.'));
    await user.type(screen.getByLabelText('Código'), '000000');
    await user.type(screen.getByLabelText('Nueva contraseña'), 'Nueva2026!');
    await user.type(screen.getByLabelText('Repite la contraseña'), 'Nueva2026!');
    await user.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));
    expect(await screen.findByText('El codigo es incorrecto o ya vencio.')).toBeInTheDocument();
    expect(screen.getByLabelText('Código')).toBeInTheDocument();
  });
});
