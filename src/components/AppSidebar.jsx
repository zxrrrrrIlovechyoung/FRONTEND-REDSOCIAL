import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const herramientas = [
  { icono: '⌂', texto: 'Inicio', ruta: '/inicio' },
  { icono: '⌕', texto: 'Buscar', ruta: '/buscar' },
  { icono: '+', texto: 'Crear', ruta: '#' },
  { icono: '♡', texto: 'Favoritos', ruta: '/favoritos' },
  { icono: '✉', texto: 'Mensajes', ruta: '/mensajes' },
]

export default function AppSidebar({ activo = 'Inicio' }) {
  const { usuario } = useAuth()
  const [sidebarContraido, setSidebarContraido] = useState(false)
  const nombre = usuario?.nombreUsuario || usuario?.usuario || 'Raul'

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
          {herramientas.map((item) => {
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
        <div className="profile-avatar">{nombre.slice(0, 2).toUpperCase()}</div>
        <div className="profile-copy">
          <strong>{nombre}</strong>
          <span>@{String(nombre).toLowerCase()}</span>
        </div>
      </Link>
    </aside>
  )
}
