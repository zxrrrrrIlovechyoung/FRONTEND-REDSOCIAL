import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import SessionSkeleton from '../components/SessionSkeleton'

export default function RutaPorRol({ rolesPermitidos }) {
  const { estaAutenticado, usuario, restaurandoSesion } = useAuth()
  if (restaurandoSesion) return <SessionSkeleton />
  if (!estaAutenticado) return <Navigate to="/login" replace />

  const rolActivo = usuario?.rolActivo ?? usuario?.rol ?? 'usuario'
  const roles = usuario?.roles ?? [rolActivo]
  const tienePermiso = rolesPermitidos.includes(rolActivo) && rolesPermitidos.some((rol) => roles.includes(rol))

  return tienePermiso ? <Outlet /> : <Navigate to="/inicio" replace />
}
