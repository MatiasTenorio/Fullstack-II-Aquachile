import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import ProtectedRoute from './ProtectedRoute';

const { auth } = vi.hoisted(() => ({ auth: { usuarioActual: null } }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => auth }));

function renderEn(ruta) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/login" element={<h1>Login</h1>} />
        <Route path="/dashboard" element={<h1>Inicio</h1>} />
        <Route element={<ProtectedRoute roles={['ADMINISTRADOR']} />}>
          <Route path="/usuarios" element={<h1>Usuarios</h1>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  it('sin sesión manda al login', () => {
    // ProtectedRoute
    // /usuarios sin usuario muestra el login
    auth.usuarioActual = null;
    renderEn('/usuarios');
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
  });

  it('con un rol no permitido devuelve a la pantalla de inicio', () => {
    // ProtectedRoute
    // Un analista que abre /usuarios termina en /dashboard
    auth.usuarioActual = { rol: 'ANALISTA_RECLUTAMIENTO' };
    renderEn('/usuarios');
    expect(screen.getByRole('heading', { name: 'Inicio' })).toBeInTheDocument();
  });

  it('con el rol permitido muestra la página', () => {
    // ProtectedRoute
    // El administrador ve /usuarios
    auth.usuarioActual = { rol: 'ADMINISTRADOR' };
    renderEn('/usuarios');
    expect(screen.getByRole('heading', { name: 'Usuarios' })).toBeInTheDocument();
  });
});
