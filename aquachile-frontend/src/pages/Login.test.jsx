import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import Login from './Login';

const { login } = vi.hoisted(() => ({ login: vi.fn() }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ login }) }));

function renderWithRouter() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/solicitudes" element={<h1>Historial</h1>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Login', () => {
  it('muestra los campos y el botón de ingreso', () => {
    // Login
    // Aparecen correo, contraseña y botón Ingresar
    renderWithRouter();
    expect(screen.getByLabelText('Correo')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ingresar/i })).toBeInTheDocument();
  });

  it('avisa si faltan datos', async () => {
    // Login
    // Muestra "Completa correo y contraseña" y no llama al login
    const user = userEvent.setup();
    renderWithRouter();
    await user.click(screen.getByRole('button', { name: /ingresar/i }));
    expect(screen.getByText('Completa correo y contraseña')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('inicia sesión y navega al historial', async () => {
    // Login
    // Llama a login con los datos y navega a /solicitudes
    login.mockResolvedValue({});
    const user = userEvent.setup();
    renderWithRouter();
    await user.type(screen.getByLabelText('Correo'), 'analista@aquachile.test');
    await user.type(screen.getByLabelText('Contraseña'), 'Aqua2026!');
    await user.click(screen.getByRole('button', { name: /ingresar/i }));
    expect(login).toHaveBeenCalledWith('analista@aquachile.test', 'Aqua2026!');
    expect(await screen.findByRole('heading', { name: 'Historial' })).toBeInTheDocument();
  });
});
