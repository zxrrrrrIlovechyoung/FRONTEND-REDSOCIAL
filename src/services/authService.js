import httpClient from '../api/httpClient'

// Extrae el mensaje del backend (Resultado<T> o errores de validación de ASP.NET).
const mensajeDeError = (error) => {
  const data = error.response?.data
  if (data?.mensaje) return data.mensaje
  if (data?.errors) return Object.values(data.errors).flat().join(' ')
  if (error.response?.status === 429) return 'Demasiados intentos. Espera un minuto.'
  return 'Ups, algo salió mal. Inténtalo más tarde'
}

const llamar = async (peticion) => {
  try {
    const { data } = await peticion()
    return data
  } catch (error) {
    return { exito: false, mensaje: mensajeDeError(error) }
  }
}

export const authService = {
  login: (usuarioOEmail, password) => llamar(() => httpClient.post('/auth/login', { usuarioOEmail, password })),
  solicitarCodigoEmail: (email) => llamar(() => httpClient.post('/auth/registro/solicitar-codigo', { email })),
  verificarCodigoEmail: (email, codigo) => llamar(() => httpClient.post('/auth/registro/verificar-codigo', { email, codigo })),
  cancelarCodigoEmail: (email) => llamar(() => httpClient.post('/auth/registro/cancelar-codigo', { email })),
  verificarEmailDisponible: (email) => llamar(() => httpClient.get('/auth/registro/email-disponible', { params: { email } })),
  verificarUsuarioDisponible: (nombreUsuario) => llamar(() => httpClient.get(`/auth/registro/usuario-disponible/${encodeURIComponent(nombreUsuario)}`)),
  solicitarRecuperacionPassword: (email) => llamar(() => httpClient.post('/auth/recuperar-password/solicitar-codigo', { email })),
  verificarRecuperacionPassword: (email, codigo) => llamar(() => httpClient.post('/auth/recuperar-password/verificar-codigo', { email, codigo })),
  cambiarPassword: (email, recoveryToken, nuevaPassword) => llamar(() => httpClient.post('/auth/recuperar-password/cambiar', { email, recoveryToken, nuevaPassword })),
  registrar: (datos) => llamar(() => httpClient.post('/auth/registro', datos)),
  perfil: () => llamar(() => httpClient.get('/auth/perfil')),
}
