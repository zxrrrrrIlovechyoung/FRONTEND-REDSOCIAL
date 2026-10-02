import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { rutaInicialPorRol } from '../utils/rutasPorRol'

const opciones = {
  usuario: {
    titulo: 'Entrar como usuario',
    descripcion: 'Comparte momentos, busca perfiles, chatea y vive Moment como todos los demas.',
    icono: '⌂',
  },
  moderador: {
    titulo: 'Entrar como moderador',
    descripcion: 'Revisa reportes, spam, alertas y acciones de seguridad dentro de la comunidad.',
    icono: '!',
  },
  admin: {
    titulo: 'Entrar como admin',
    descripcion: 'Gestiona roles, permisos y configuracion global de Moment.',
    icono: '✦',
  },
}

export default function SeleccionarEntrada() {
  const { usuario, estaAutenticado, seleccionarRolActivo } = useAuth()
  const navigate = useNavigate()

  if (!estaAutenticado) return <Navigate to="/login" replace />

  const roles = usuario?.roles?.length ? usuario.roles : [usuario?.rol ?? 'usuario']

  const elegirEntrada = (rol) => {
    seleccionarRolActivo(rol)
    navigate(rutaInicialPorRol(rol), { replace: true })
  }

  return (
    <main className="role-select-page">
      <section className="role-select-card" aria-label="Seleccionar entrada">
        <div className="role-select-head">
          <div className="auth-brand">
            <span className="brand-mark">M</span>
            <strong>Moment</strong>
          </div>
          {usuario?.esFundador && <span className="founder-pin">Fundador</span>}
          <h1>¿Cómo quieres entrar?</h1>
          <p>{usuario?.nombrePerfil ?? usuario?.nombreUsuario}, tienes más de un rol disponible. Elige el modo de trabajo para esta sesión.</p>
        </div>

        <div className="role-options">
          {roles.map((rol) => {
            const opcion = opciones[rol] ?? opciones.usuario
            return (
              <button className={`role-option role-${rol}`} key={rol} onClick={() => elegirEntrada(rol)}>
                <span>{opcion.icono}</span>
                <div>
                  <strong>{opcion.titulo}</strong>
                  <p>{opcion.descripcion}</p>
                </div>
              </button>
            )
          })}
        </div>
      </section>
    </main>
  )
}
