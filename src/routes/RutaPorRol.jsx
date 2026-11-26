import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RutaPorRol({ rolesPermitidos }) {
  const { estaAutenticado, usuario, restaurandoSesion } = useAuth()
  if (restaurandoSesion) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando sesión…</div>
  if (!estaAutenticado) return <Navigate to="/login" replace />

  const rolActivo = usuario?.rolActivo ?? usuario?.rol ?? 'usuario'
  const roles = usuario?.roles ?? [rolActivo]
  const tienePermiso = rolesPermitidos.includes(rolActivo) && rolesPermitidos.some((rol) => roles.includes(rol))

  return tienePermiso ? <Outlet /> : <Navigate to="/inicio" replace />
}
