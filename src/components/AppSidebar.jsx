import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
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

const SIDEBAR_KEY_BASE = 'moment_sidebar_contraido'

export default function AppSidebar({ activo = 'Inicio' }) {
  const navigate = useNavigate()
  const { usuario, perfilActual } = useAuth()
  const [mobileNavOculta, setMobileNavOculta] = useState(false)
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false)
  const sidebarStorageKey = useMemo(() => (
    `${SIDEBAR_KEY_BASE}_${usuario?.idUsuario ?? usuario?.nombreUsuario ?? 'anon'}`
  ), [usuario?.idUsuario, usuario?.nombreUsuario])
  const [sidebarContraido, setSidebarContraido] = useState(() => {
    const guardado = localStorage.getItem(SIDEBAR_KEY_BASE)
    return guardado === 'true'
  })
  const nombre = perfilActual?.nombrePerfil || usuario?.nombrePerfil || usuario?.nombreUsuario || usuario?.usuario || 'Raul'
  const nombreUsuario = perfilActual?.nombreUsuario || usuario?.nombreUsuario || usuario?.usuario || nombre
  const fotoPerfilUrl = normalizarMediaUrl(perfilActual?.fotoPerfilUrl)
  const rol = usuario?.rolActivo ?? usuario?.rol ?? 'usuario'
  const puedeCambiarRol = (usuario?.roles?.length ?? 0) > 1
  const herramientasVisibles = ['moderador', 'admin'].includes(rol)
    ? [...herramientas, { icono: '!', texto: 'Moderador', ruta: '/moderador' }]
    : herramientas

  const abrirCrearMomento = () => {
    navigate('/inicio?crear=1')
  }

  useEffect(() => {
    const guardadoUsuario = localStorage.getItem(sidebarStorageKey)
    const guardadoGeneral = localStorage.getItem(SIDEBAR_KEY_BASE)
    setSidebarContraido((guardadoUsuario ?? guardadoGeneral) === 'true')
  }, [sidebarStorageKey])

  useEffect(() => {
    let ultimaPosicion = window.scrollY

    const manejarScroll = () => {
      const posicionActual = Math.max(window.scrollY, 0)
      const diferencia = posicionActual - ultimaPosicion

      if (Math.abs(diferencia) < 6) return
      setMobileNavOculta(posicionActual > ultimaPosicion && posicionActual > 72)
      ultimaPosicion = posicionActual
    }

    window.addEventListener('scroll', manejarScroll, { passive: true })
    return () => window.removeEventListener('scroll', manejarScroll)
  }, [])

  const alternarSidebar = () => {
    setSidebarContraido((valor) => {
      const siguiente = !valor
      localStorage.setItem(sidebarStorageKey, String(siguiente))
      localStorage.setItem(SIDEBAR_KEY_BASE, String(siguiente))
      return siguiente
    })
  }

  return (
    <aside className={`sidebar${sidebarContraido ? ' contraido' : ''}${mobileNavOculta ? ' mobile-nav-oculta' : ''}`}>
      <header className="mobile-topbar">
        <button
          className={`mobile-menu-button${menuMovilAbierto ? ' abierto' : ''}`}
          type="button"
          aria-label={menuMovilAbierto ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuMovilAbierto}
          onClick={() => setMenuMovilAbierto((valor) => !valor)}
        >
          <span />
          <span />
          <span />
        </button>
        <Link className="mobile-topbar-brand" to="/inicio">Moment</Link>
        <Link className="mobile-messages-link" to="/mensajes" aria-label="Abrir mensajes">
          <span>✉</span>
          <i>{'3'}</i>
        </Link>
      </header>

      {menuMovilAbierto && (
        <div className="mobile-drawer-layer" role="presentation" onClick={() => setMenuMovilAbierto(false)}>
          <aside className="mobile-drawer" role="dialog" aria-label="Menú principal" onClick={(event) => event.stopPropagation()}>
            <div className="mobile-drawer-head">
              <div>
                <span className="brand-mark">M</span>
                <strong>Moment</strong>
              </div>
              <button type="button" onClick={() => setMenuMovilAbierto(false)} aria-label="Cerrar menú">×</button>
            </div>
            <nav className="mobile-drawer-links">
              <Link className={activo === 'Inicio' ? 'activo' : ''} to="/inicio" onClick={() => setMenuMovilAbierto(false)}>⌂ <span>Inicio</span></Link>
              <Link className={activo === 'Perfil' ? 'activo' : ''} to="/perfil" onClick={() => setMenuMovilAbierto(false)}>◉ <span>Mi perfil</span></Link>
              <Link className={activo === 'Buscar' ? 'activo' : ''} to="/buscar" onClick={() => setMenuMovilAbierto(false)}>⌕ <span>Buscar</span></Link>
              <Link className={activo === 'Favoritos' ? 'activo' : ''} to="/favoritos" onClick={() => setMenuMovilAbierto(false)}>♡ <span>Favoritos</span></Link>
              <Link className={activo === 'Configuracion' ? 'activo' : ''} to="/configuracion" onClick={() => setMenuMovilAbierto(false)}>⚙ <span>Configuración</span></Link>
              <Link to="/mensajes" onClick={() => setMenuMovilAbierto(false)}>✉ <span>Mensajes</span></Link>
            </nav>
          </aside>
        </div>
      )}

      <div className="desktop-sidebar-content">
        <div className="sidebar-head">
          <Link className="brand" to="/inicio">
            <span className="brand-mark">M</span>
            <span>Moment</span>
          </Link>
          <button
            className="sidebar-toggle"
            onClick={alternarSidebar}
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
                  onClick={abrirCrearMomento}
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

      <div className={`profile-mini-card${puedeCambiarRol ? ' con-rol' : ''}`}>
        <Link className="profile-mini" to="/perfil">
          <div className="profile-avatar">
            {fotoPerfilUrl ? <img src={fotoPerfilUrl} alt="Foto de perfil" /> : nombre.slice(0, 2).toUpperCase()}
          </div>
          <div className="profile-copy">
            <strong>{nombre}</strong>
            <span>@{String(nombreUsuario).replace('@', '').toLowerCase()}</span>
          </div>
        </Link>

        {puedeCambiarRol && (
          <button className="profile-role-switch" onClick={() => navigate('/seleccionar-entrada')}>
            Cambiar rol
          </button>
        )}
      </div>

      <nav className="mobile-nav" aria-label="Navegación móvil">
        <div className="mobile-nav-group">
          <Link className={`mobile-nav-item${activo === 'Inicio' ? ' activo' : ''}`} to="/inicio">
            <span className="mobile-nav-icon">⌂</span>
            <span>Inicio</span>
          </Link>
          <Link className={`mobile-nav-item${activo === 'Buscar' ? ' activo' : ''}`} to="/buscar">
            <span className="mobile-nav-icon">⌕</span>
            <span>Buscar</span>
          </Link>
        </div>

        <button className="mobile-nav-share" type="button" onClick={abrirCrearMomento} aria-label="Compartir un momento">
          <span>+</span>
        </button>

        <div className="mobile-nav-group">
          <Link className={`mobile-nav-item${activo === 'Favoritos' ? ' activo' : ''}`} to="/favoritos">
            <span className="mobile-nav-icon">♡</span>
            <span>Favoritos</span>
          </Link>
          <Link className={`mobile-nav-item${activo === 'Perfil' ? ' activo' : ''}`} to="/perfil">
            <span className="mobile-nav-icon">◉</span>
            <span>Perfil</span>
          </Link>
        </div>
      </nav>
    </aside>
  )
}
