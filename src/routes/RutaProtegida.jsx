import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Solo es una protección de UX: la seguridad real la aplica el backend con [Authorize].
export default function RutaProtegida() {
  const { estaAutenticado } = useAuth()
  return estaAutenticado ? <Outlet /> : <Navigate to="/login" replace />
}
