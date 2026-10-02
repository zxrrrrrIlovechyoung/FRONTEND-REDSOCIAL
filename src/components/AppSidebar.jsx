import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:5079/api').replace(/\/api\/?$/, '')

const normalizarMediaUrl = (url) => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${apiBaseUrl}${url.startsWith('/') ? url : `/${url}`}`
}

const herramientas = [
  { icono: '⌂', texto: 'Inicio', ruta: '/inicio' },
  { icono: '⌕', texto: 'Buscar', ruta: '/buscar' },
  { icono: '+', texto: 'Crear', ruta: '#' },
  { icono: '♡', texto: 'Favoritos', ruta: '/favoritos' },
  { icono: '✉', texto: 'Mensajes', ruta: '/mensajes' },
]

export default function AppSidebar({ activo = 'Inicio' }) {
  const { usuario, perfilActual } = useAuth()
  const [sidebarContraido, setSidebarContraido] = useState(false)
  const nombre = perfilActual?.nombrePerfil || usuario?.nombrePerfil || usuario?.nombreUsuario || usuario?.usuario || 'Raul'
  const nombreUsuario = perfilActual?.nombreUsuario || usuario?.nombreUsuario || usuario?.usuario || nombre
  const fotoPerfilUrl = normalizarMediaUrl(perfilActual?.fotoPerfilUrl)
  const rol = usuario?.rol ?? 'usuario'
  const herramientasVisibles = ['moderador', 'admin'].includes(rol)
    ? [...herramientas, { icono: '!', texto: 'Moderador', ruta: '/moderador' }]
    : herramientas

  return (
    <aside className={`sidebar${sidebarContraido ? ' contraido' : ''}`}>
      <div>
        <div className="sidebar-head">
          <Link className="brand" to="/inicio">
            <span className="brand-mark">M</span>
            <span>Moment</span>
          </Link>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarContraido((valor) => !valor)}
            aria-label={sidebarContraido ? 'Expandir sidebar' : 'Contraer sidebar'}
          >
            {sidebarContraido ? '›' : '‹'}
          </button>
        </div>

        <Link className="brand brand-compact" to="/inicio">
          <span className="brand-mark">M</span>
        </Link>

        <nav className="side-nav" aria-label="Herramientas principales">
          {herramientasVisibles.map((item) => {
            const contenido = (
              <>
                <span className="nav-icon">{item.icono}</span>
                <span>{item.texto}</span>
              </>
            )

            return item.ruta === '#'
              ? (
                <button
                  className={`nav-item${activo === item.texto ? ' activo' : ''}`}
                  key={item.texto}
                  onClick={() => item.texto === 'Crear' && window.dispatchEvent(new Event('abrir-crear-momento'))}
                >
                  {contenido}
                </button>
              )
              : (
                <Link className={`nav-item${activo === item.texto ? ' activo' : ''}`} key={item.texto} to={item.ruta}>
                  {contenido}
                </Link>
              )
          })}
        </nav>
      </div>

      <Link className="profile-mini" to="/perfil">
        <div className="profile-avatar">
          {fotoPerfilUrl ? <img src={fotoPerfilUrl} alt="Foto de perfil" /> : nombre.slice(0, 2).toUpperCase()}
        </div>
        <div className="profile-copy">
          <strong>{nombre}</strong>
          <span>@{String(nombreUsuario).toLowerCase()}</span>
        </div>
      </Link>
    </aside>
  )
}
