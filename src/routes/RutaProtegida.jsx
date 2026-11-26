import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import SessionSkeleton from '../components/SessionSkeleton'

// Solo es una protección de UX: la seguridad real la aplica el backend con [Authorize].
export default function RutaProtegida() {
  const { estaAutenticado, restaurandoSesion } = useAuth()
  if (restaurandoSesion) return <SessionSkeleton />
  return estaAutenticado ? <Outlet /> : <Navigate to="/login" replace />
}
