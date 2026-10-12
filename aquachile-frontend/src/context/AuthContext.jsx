import { createContext, useContext, useState } from 'react';
import { USUARIOS_MOCK } from '../data/usuarios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuarioActual, setUsuarioActual] = useState(null);

  const login = (usuario, password) => {
    const encontrado = USUARIOS_MOCK.find(
      (u) => u.usuario === usuario && u.password === password
    );
    if (encontrado) {
      setUsuarioActual(encontrado);
      return true;
    }
    return false;
  };

  const logout = () => setUsuarioActual(null);

  return (
    <AuthContext.Provider value={{ usuarioActual, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}