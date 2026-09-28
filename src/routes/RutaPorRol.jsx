import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RutaPorRol({ rolesPermitidos }) {
  const { estaAutenticado, usuario } = useAuth()
  if (!estaAutenticado) return <Navigate to="/login" replace />

  const rol = usuario?.rol ?? 'usuario'
  return rolesPermitidos.includes(rol) ? <Outlet /> : <Navigate to="/inicio" replace />
}
