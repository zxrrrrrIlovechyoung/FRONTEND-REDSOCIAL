import { createContext, useContext, useState } from 'react'
import { authService } from '../services/authService'
import { tokenStorage } from '../utils/tokenStorage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(tokenStorage.obtenerUsuario)

  const iniciarSesion = (datos) => {
    tokenStorage.guardar(datos)
    setUsuario(tokenStorage.obtenerUsuario())
  }

  const login = async (usuarioOEmail, password) => {
    const resultado = await authService.login(usuarioOEmail, password)
    if (resultado.exito) {
      iniciarSesion(resultado.datos)
      return { ...resultado, datos: tokenStorage.obtenerUsuario() }
    }
    return resultado
  }

  // Registrar no inicia sesión: el usuario debe autenticarse después en el login.
  const registrar = (datos) => authService.registrar(datos)

  const logout = () => {
    tokenStorage.limpiar()
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, estaAutenticado: !!usuario, login, registrar, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
