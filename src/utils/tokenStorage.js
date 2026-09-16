// sessionStorage: la sesión muere al cerrar la pestaña. Sigue siendo accesible
// desde JS (riesgo XSS); la mejora futura es una cookie HttpOnly desde el backend.
const TOKEN_KEY = 'rs_token'
const USUARIO_KEY = 'rs_usuario'

export const tokenStorage = {
  obtener: () => sessionStorage.getItem(TOKEN_KEY),
  obtenerUsuario: () => JSON.parse(sessionStorage.getItem(USUARIO_KEY) ?? 'null'),
  guardar: ({ token, ...usuario }) => {
    sessionStorage.setItem(TOKEN_KEY, token)
    sessionStorage.setItem(USUARIO_KEY, JSON.stringify(usuario))
  },
  limpiar: () => {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USUARIO_KEY)
  },
}
