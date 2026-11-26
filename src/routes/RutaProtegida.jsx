import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Solo es una protección de UX: la seguridad real la aplica el backend con [Authorize].
export default function RutaProtegida() {
  const { estaAutenticado, restaurandoSesion } = useAuth()
  if (restaurandoSesion) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando sesión…</div>
  return estaAutenticado ? <Outlet /> : <Navigate to="/login" replace />
}
