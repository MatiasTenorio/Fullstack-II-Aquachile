import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { ApiError, apiFetch, descargarArchivo } from '../services/api';

const AuthContext = createContext(null);
const CLAVE_SESION = 'aquachile.sesion';

// La sesión vive en sessionStorage: sobrevive a recargar la página, pero se pierde al cerrar la pestaña.
function leerSesion() {
  try {
    const bruto = sessionStorage.getItem(CLAVE_SESION);
    if (!bruto) return null;
    const sesion = JSON.parse(bruto);
    if (!sesion?.token || !sesion?.usuario || sesion.expiraEn <= Date.now()) {
      sessionStorage.removeItem(CLAVE_SESION);
      return null;
    }
    return sesion;
  } catch {
    return null;
  }
}

function guardarSesion(sesion) {
  try {
    if (sesion) sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
    else sessionStorage.removeItem(CLAVE_SESION);
  } catch {
    // sin almacenamiento disponible: la sesión dura solo mientras la página siga abierta
  }
}

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(leerSesion);

  // Lanza ApiError si las credenciales son incorrectas o el servidor no responde.
  const login = useCallback(async (email, password) => {
    const respuesta = await apiFetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const nueva = {
      token: respuesta.token,
      usuario: respuesta.usuario,
      expiraEn: Date.now() + respuesta.expiraEnSegundos * 1000,
    };
    guardarSesion(nueva);
    setSesion(nueva);
    return respuesta.usuario;
  }, []);

  const logout = useCallback(() => {
    guardarSesion(null);
    setSesion(null);
  }, []);

  const token = sesion?.token ?? null;

  // Llamadas al backend con el token puesto. Si el backend responde 401 (token vencido), cierra la sesión.
  const api = useCallback(
    async (ruta, opciones = {}) => {
      try {
        return await apiFetch(ruta, { ...opciones, token });
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) logout();
        throw error;
      }
    },
    [token, logout]
  );

  const descargar = useCallback(
    async (ruta) => {
      try {
        return await descargarArchivo(ruta, { token });
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) logout();
        throw error;
      }
    },
    [token, logout]
  );

  const valor = useMemo(
    () => ({ usuarioActual: sesion?.usuario ?? null, token, login, logout, api, descargar }),
    [sesion, token, login, logout, api, descargar]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
