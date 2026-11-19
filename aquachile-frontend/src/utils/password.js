// Reglas de la contraseña, las mismas que valida el backend:
// entre 8 y 72 caracteres, con al menos una letra y un número.
// Devuelve el mensaje de error, o '' si la contraseña es válida.
export function validarPassword(password) {
  if (!password) return 'Escribe la nueva contraseña';
  if (password.length < 8 || password.length > 72) return 'La contraseña debe tener entre 8 y 72 caracteres';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'La contraseña debe incluir al menos una letra y un número';
  }
  return '';
}

// El código que llega por correo tiene 6 dígitos.
export function validarCodigo(codigo) {
  return /^\d{6}$/.test(codigo.trim()) ? '' : 'El código tiene 6 dígitos';
}
