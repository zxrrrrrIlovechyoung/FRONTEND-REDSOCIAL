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
  const verificarEmailDisponible = useCallback((email) => authService.verificarEmailDisponible(email), [])
  const verificarUsuarioDisponible = useCallback((nombreUsuario) => authService.verificarUsuarioDisponible(nombreUsuario), [])
  const solicitarRecuperacionPassword = useCallback((email) => authService.solicitarRecuperacionPassword(email), [])
  const verificarRecuperacionPassword = useCallback((email, codigo) => authService.verificarRecuperacionPassword(email, codigo), [])
  const cambiarPassword = useCallback((email, recoveryToken, nuevaPassword) => authService.cambiarPassword(email, recoveryToken, nuevaPassword), [])

  const logout = useCallback(() => {
    tokenStorage.limpiar()
    setUsuario(null)
  }, [])

  return (
    <AuthContext.Provider value={{ usuario, estaAutenticado: !!usuario, login, registrar, solicitarCodigoEmail, verificarCodigoEmail, cancelarCodigoEmail, verificarEmailDisponible, verificarUsuarioDisponible, solicitarRecuperacionPassword, verificarRecuperacionPassword, cambiarPassword, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
