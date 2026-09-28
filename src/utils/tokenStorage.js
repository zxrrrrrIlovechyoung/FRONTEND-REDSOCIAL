// sessionStorage: la sesión muere al cerrar la pestaña. Sigue siendo accesible
// desde JS (riesgo XSS); la mejora futura es una cookie HttpOnly desde el backend.
const TOKEN_KEY = 'rs_token'
const USUARIO_KEY = 'rs_usuario'

const leerPayloadJwt = (token) => {
  try {
    const payload = token.split('.')[1]
    const normalizado = payload.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(decodeURIComponent(escape(atob(normalizado))))
  } catch {
    return {}
  }
}

const normalizarRol = ({ rol, role, nombreUsuario, email, token }) => {
  const payload = token ? leerPayloadJwt(token) : {}
  const rolDetectado = rol
    ?? role
    ?? payload.rol
    ?? payload.role
    ?? payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']

  if (rolDetectado) return String(rolDetectado).toLowerCase()

  const identificador = `${nombreUsuario ?? ''} ${email ?? ''}`.toLowerCase()
  if (identificador.includes('admin')) return 'admin'
  if (identificador.includes('moderador') || identificador.includes('mod')) return 'moderador'
  return 'usuario'
}

export const tokenStorage = {
  obtener: () => sessionStorage.getItem(TOKEN_KEY),
  obtenerUsuario: () => JSON.parse(sessionStorage.getItem(USUARIO_KEY) ?? 'null'),
  guardar: ({ token, ...usuario }) => {
    const usuarioConRol = { ...usuario, rol: normalizarRol({ ...usuario, token }) }
    sessionStorage.setItem(TOKEN_KEY, token)
    sessionStorage.setItem(USUARIO_KEY, JSON.stringify(usuarioConRol))
  },
  limpiar: () => {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USUARIO_KEY)
  },
}
