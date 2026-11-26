import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { authService } from '../services/authService'
import { tokenStorage } from '../utils/tokenStorage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => (
    tokenStorage.obtener() ? tokenStorage.obtenerUsuario() : null
  ))
  const [perfilActual, setPerfilActual] = useState(null)
  const [restaurandoSesion, setRestaurandoSesion] = useState(() => !tokenStorage.obtener())

  const iniciarSesion = (datos) => {
    if (datos?.token) tokenStorage.guardar(datos)
    else tokenStorage.guardarUsuario(datos)
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

  const reactivarCuenta = useCallback(async (usuarioOEmail, password) => {
    const resultado = await authService.reactivarCuenta(usuarioOEmail, password)
    if (resultado.exito) {
      iniciarSesion(resultado.datos)
      return { ...resultado, datos: tokenStorage.obtenerUsuario() }
    }
    return resultado
  }, [])

  useEffect(() => {
    let cancelado = false

    const restaurarSesion = async () => {
      const sesionGuardada = tokenStorage.obtener()
      const [, resultadoSesion] = await Promise.all([
        authService.csrf(),
        sesionGuardada ? Promise.resolve(null) : authService.sesion(),
      ])

      if (cancelado) return
      if (resultadoSesion?.exito && resultadoSesion.datos) {
        setUsuario(tokenStorage.guardarUsuario(resultadoSesion.datos))
      }
      setRestaurandoSesion(false)
    }

    restaurarSesion()
    return () => { cancelado = true }
  }, [])

  const refrescarPerfil = useCallback(async () => {
    if (!usuario && !tokenStorage.obtener()) {
      setPerfilActual(null)
      return null
    }

    const resultado = await authService.miPerfil()
    if (resultado.exito) {
      setPerfilActual(resultado.datos)
      return resultado.datos
    }

    return null
  }, [usuario])

  useEffect(() => {
    if (usuario) refrescarPerfil()
    else setPerfilActual(null)
  }, [usuario, refrescarPerfil])

  useEffect(() => {
    const actualizar = () => refrescarPerfil()
    window.addEventListener('perfil-actualizado', actualizar)
    return () => window.removeEventListener('perfil-actualizado', actualizar)
  }, [refrescarPerfil])

  // Registrar no inicia sesión: el usuario debe autenticarse después en el login.
  const registrar = useCallback((datos) => authService.registrar(datos), [])
  const solicitarCodigoEmail = useCallback((email) => authService.solicitarCodigoEmail(email), [])
  const verificarCodigoEmail = useCallback((email, codigo) => authService.verificarCodigoEmail(email, codigo), [])
  const cancelarCodigoEmail = useCallback((email) => authService.cancelarCodigoEmail(email), [])
  const verificarEmailDisponible = useCallback((email) => authService.verificarEmailDisponible(email), [])
  const verificarUsuarioDisponible = useCallback((nombreUsuario) => authService.verificarUsuarioDisponible(nombreUsuario), [])
  const solicitarRecuperacionPassword = useCallback((email, confirmarReactivacion = false) => authService.solicitarRecuperacionPassword(email, confirmarReactivacion), [])
  const verificarRecuperacionPassword = useCallback((email, codigo) => authService.verificarRecuperacionPassword(email, codigo), [])
  const cambiarPassword = useCallback((email, recoveryToken, nuevaPassword) => authService.cambiarPassword(email, recoveryToken, nuevaPassword), [])

  const seleccionarRolActivo = useCallback((rolActivo) => {
    const actualizado = tokenStorage.actualizarUsuario({ rolActivo })
    setUsuario(actualizado)
    return actualizado
  }, [])

  const logout = useCallback(() => {
    tokenStorage.limpiar()
    setUsuario(null)
    setPerfilActual(null)
    return authService.logout()
  }, [])

  return (
    <AuthContext.Provider value={{ usuario, perfilActual, restaurandoSesion, refrescarPerfil, estaAutenticado: !!usuario, login, reactivarCuenta, registrar, solicitarCodigoEmail, verificarCodigoEmail, cancelarCodigoEmail, verificarEmailDisponible, verificarUsuarioDisponible, solicitarRecuperacionPassword, verificarRecuperacionPassword, cambiarPassword, seleccionarRolActivo, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
