import { createContext, useCallback, useContext, useState } from 'react'
import { authService } from '../services/authService'
import { tokenStorage } from '../utils/tokenStorage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(tokenStorage.obtenerUsuario)

  const iniciarSesion = (datos) => {
    tokenStorage.guardar(datos)
    setUsuario(tokenStorage.obtenerUsuario())
  }

  const login = useCallback(async (usuarioOEmail, password) => {
    const resultado = await authService.login(usuarioOEmail, password)
    if (resultado.exito) {
      iniciarSesion(resultado.datos)
      return { ...resultado, datos: tokenStorage.obtenerUsuario() }
    }
    return resultado
  }, [])

  // Registrar no inicia sesión: el usuario debe autenticarse después en el login.
  const registrar = useCallback((datos) => authService.registrar(datos), [])
  const solicitarCodigoEmail = useCallback((email) => authService.solicitarCodigoEmail(email), [])
  const verificarCodigoEmail = useCallback((email, codigo) => authService.verificarCodigoEmail(email, codigo), [])
  const cancelarCodigoEmail = useCallback((email) => authService.cancelarCodigoEmail(email), [])
  const verificarUsuarioDisponible = useCallback((nombreUsuario) => authService.verificarUsuarioDisponible(nombreUsuario), [])

  const logout = useCallback(() => {
    tokenStorage.limpiar()
    setUsuario(null)
  }, [])

  return (
    <AuthContext.Provider value={{ usuario, estaAutenticado: !!usuario, login, registrar, solicitarCodigoEmail, verificarCodigoEmail, cancelarCodigoEmail, verificarUsuarioDisponible, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
