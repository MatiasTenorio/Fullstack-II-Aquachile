import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Usuarios from './Usuarios';

const { auth } = vi.hoisted(() => ({ auth: { api: vi.fn(), usuarioActual: { id: 3, rol: 'ADMINISTRADOR' } } }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => auth }));

const usuarios = [
  { id: 3, nombre: 'Admin Prueba', email: 'admin@aquachile.test', rol: 'ADMINISTRADOR', activo: true },
  { id: 1, nombre: 'Analista Prueba', email: 'analista@aquachile.test', rol: 'ANALISTA_RECLUTAMIENTO', activo: true },
];

describe('Usuarios', () => {
  beforeEach(() => {
    auth.api.mockReset();
    auth.api.mockImplementation(async (ruta, opciones) => {
      if (opciones?.method === 'POST') {
        return { id: 9, activo: true, ...JSON.parse(opciones.body) };
      }
      if (opciones?.method === 'PATCH') {
        return { ...usuarios[1], ...JSON.parse(opciones.body) };
      }
      return usuarios;
    });
  });

  it('lista los usuarios y no deja al administrador modificarse a sí mismo', async () => {
    // Usuarios
    // Su propia fila tiene el rol bloqueado y no ofrece "Desactivar"
    render(<Usuarios />);
    expect(await screen.findByText('analista@aquachile.test')).toBeInTheDocument();
    expect(screen.getByLabelText('Rol de Admin Prueba')).toBeDisabled();
    expect(screen.getByLabelText('Rol de Analista Prueba')).toBeEnabled();
    expect(screen.getAllByRole('button', { name: 'Desactivar' })).toHaveLength(1);
  });

  it('crea un usuario con su rol', async () => {
    // Usuarios
    // Envía POST /usuarios con nombre, correo y rol, y lo agrega a la tabla
    const user = userEvent.setup();
    render(<Usuarios />);
    await screen.findByText('analista@aquachile.test');
    await user.type(screen.getByLabelText(/^nombre/i), 'Eva Dos');
    await user.type(screen.getByLabelText(/^correo/i), 'eva@aquachile.test');
    await user.selectOptions(screen.getByLabelText(/^rol \*/i), 'PROFESIONAL_EVALUADOR');
    await user.click(screen.getByRole('button', { name: 'Crear usuario' }));
    expect(auth.api).toHaveBeenCalledWith('/usuarios', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ nombre: 'Eva Dos', email: 'eva@aquachile.test', rol: 'PROFESIONAL_EVALUADOR' }),
    }));
    expect(await screen.findByText('eva@aquachile.test')).toBeInTheDocument();
  });

  it('cambia el rol de otro usuario', async () => {
    // Usuarios
    // Envía PATCH /usuarios/1 con el rol nuevo
    const user = userEvent.setup();
    render(<Usuarios />);
    await screen.findByText('analista@aquachile.test');
    await user.selectOptions(screen.getByLabelText('Rol de Analista Prueba'), 'PROFESIONAL_EVALUADOR');
    expect(auth.api).toHaveBeenCalledWith('/usuarios/1', expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({ rol: 'PROFESIONAL_EVALUADOR' }),
    }));
  });

  it('cambia la contraseña de otro usuario con el código que llega al administrador', async () => {
    // Usuarios
    // Pide el código (POST .../password/codigo), valida y envía POST /usuarios/1/password
    auth.api.mockImplementation(async (ruta, opciones) => {
      if (ruta === '/usuarios/1/password/codigo') return { mensaje: 'Enviamos un código a tu correo (admin@aquachile.test).' };
      if (ruta === '/usuarios/1/password') return { mensaje: 'La contraseña de Analista Prueba fue actualizada.' };
      return usuarios;
    });
    const user = userEvent.setup();
    render(<Usuarios />);
    await screen.findByText('analista@aquachile.test');
    // El administrador no tiene el botón: su contraseña la cambia él mismo
    expect(screen.getAllByRole('button', { name: 'Cambiar contraseña' })).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));
    await user.click(screen.getByRole('button', { name: 'Enviar código a mi correo' }));
    expect(await screen.findByText(/Enviamos un código a tu correo/)).toBeInTheDocument();

    await user.type(screen.getByLabelText('Código'), '123456');
    await user.type(screen.getByLabelText('Nueva contraseña'), 'Clave2026!');
    await user.type(screen.getByLabelText('Repite la contraseña'), 'Otra2026!');
    await user.click(screen.getAllByRole('button', { name: 'Cambiar contraseña' }).find((b) => b.type === 'submit'));
    expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Repite la contraseña'));
    await user.type(screen.getByLabelText('Repite la contraseña'), 'Clave2026!');
    await user.click(screen.getAllByRole('button', { name: 'Cambiar contraseña' }).find((b) => b.type === 'submit'));
    expect(auth.api).toHaveBeenCalledWith('/usuarios/1/password', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ codigo: '123456', nuevaPassword: 'Clave2026!' }),
    }));
    expect(await screen.findByText('La contraseña de Analista Prueba fue actualizada.')).toBeInTheDocument();
  });

  it('desactiva a otro usuario', async () => {
    // Usuarios
    // Envía PATCH /usuarios/1 con activo=false y muestra "Inactivo"
    const user = userEvent.setup();
    render(<Usuarios />);
    await screen.findByText('analista@aquachile.test');
    await user.click(screen.getByRole('button', { name: 'Desactivar' }));
    expect(auth.api).toHaveBeenCalledWith('/usuarios/1', expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({ activo: false }),
    }));
    expect(await screen.findByText('Inactivo')).toBeInTheDocument();
  });
});
