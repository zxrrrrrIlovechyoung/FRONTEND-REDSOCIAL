import { useEffect, useMemo, useState } from 'react'
import AppSidebar from '../components/AppSidebar'
import MessagesWidget from '../components/MessagesWidget'
import { busquedaService } from '../services/busquedaService'

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:5079/api').replace(/\/api\/?$/, '')

const normalizarMediaUrl = (url) => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${apiBaseUrl}${url.startsWith('/') ? url : `/${url}`}`
}

const inicialesDe = (texto) => (texto || 'MM').replace('@', '').slice(0, 2).toUpperCase()

const mapearPerfil = (perfil) => ({
  id: perfil.idUsuario,
  nombre: perfil.nombrePerfil,
  usuario: `@${perfil.nombreUsuario}`,
  avatar: inicialesDe(perfil.nombrePerfil || perfil.nombreUsuario),
  foto: normalizarMediaUrl(perfil.fotoPerfilUrl),
  bio: perfil.sobreMi || 'Sin descripción todavía.',
})

const mapearMomento = (momento) => ({
  id: momento.idMomento,
  tipo: momento.tipoAdjunto || 'texto',
  autor: momento.usuario,
  imagen: normalizarMediaUrl(momento.archivoUrl),
  texto: momento.texto,
})

export default function Buscar() {
  const [filtro, setFiltro] = useState('todo')
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [perfiles, setPerfiles] = useState([])
  const [momentos, setMomentos] = useState([])

  useEffect(() => {
    let activo = true
    setCargando(true)

    const timer = window.setTimeout(async () => {
      const resultado = await busquedaService.buscar(busqueda)
      if (!activo) return

      if (resultado.exito) {
        setPerfiles((resultado.datos?.perfiles ?? []).map(mapearPerfil))
        setMomentos((resultado.datos?.momentos ?? []).map(mapearMomento))
      }

      setCargando(false)
    }, 450)

    return () => {
      activo = false
      window.clearTimeout(timer)
    }
  }, [busqueda])

  const perfilesVisibles = useMemo(() => (
    ['todo', 'usuarios', 'perfiles'].includes(filtro) ? perfiles : []
  ), [filtro, perfiles])

  const momentosVisibles = useMemo(() => (
    ['todo', 'momentos', 'imagenes', 'videos'].includes(filtro)
      ? momentos.filter((momento) => {
        if (filtro === 'imagenes') return momento.tipo === 'foto'
        if (filtro === 'videos') return momento.tipo === 'video'
        return true
      })
      : []
  ), [filtro, momentos])

  return (
    <main className="app-shell">
      <AppSidebar activo="Buscar" />

      <section className="search-page" aria-label="Buscar">
        <header className="search-header">
          <p className="feed-kicker">Explorar Moment</p>
          <h1>Buscar</h1>
          <div className="search-box">
            <span>⌕</span>
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Busca por @usuario, nombre de perfil o momentos"
            />
          </div>
        </header>

        <div className="search-filters">
          {['todo', 'usuarios', 'perfiles', 'momentos', 'imagenes', 'videos'].map((item) => (
            <button className={filtro === item ? 'activo' : ''} key={item} onClick={() => setFiltro(item)}>
              {item}
            </button>
          ))}
        </div>

        <section className="search-section">
          <div className="profile-section-title">
            <h2>Perfiles sugeridos</h2>
            <span>{cargando ? 'Buscando...' : `${perfilesVisibles.length} resultados`}</span>
          </div>

          <div className="search-profiles">
            {cargando ? [1, 2, 3].map((item) => (
              <article className="search-profile-card skeleton-card" key={item}>
                <div className="skeleton avatar" />
                <div>
                  <span className="skeleton line wide" />
                  <span className="skeleton line small" />
                  <span className="skeleton line" />
                </div>
              </article>
            )) : perfilesVisibles.map((perfil) => (
              <article className="search-profile-card" key={perfil.id}>
                <div className="profile-avatar">{perfil.foto ? <img src={perfil.foto} alt={perfil.nombre} /> : perfil.avatar}</div>
                <div>
                  <strong>{perfil.nombre}</strong>
                  <span>{perfil.usuario}</span>
                  <p>{perfil.bio}</p>
                </div>
                <button>Ver</button>
              </article>
            ))}
          </div>
        </section>

        <section className="search-section">
          <div className="profile-section-title">
            <h2>Momentos encontrados</h2>
            <span>{cargando ? 'Cargando momentos' : `${momentosVisibles.length} publicaciones`}</span>
          </div>

          <div className="search-grid">
            {cargando ? [1, 2, 3, 4, 5, 6].map((item) => (
              <article className="search-moment skeleton-moment" key={item}>
                <span className="skeleton-fill" />
              </article>
            )) : momentosVisibles.map((momento) => (
              <article className="search-moment" key={momento.id}>
                {momento.imagen ? <img src={momento.imagen} alt={momento.texto} /> : <div className="search-text-moment">{momento.texto}</div>}
                {momento.tipo === 'video' && <span className="media-type">▷</span>}
                <div>
                  <strong>{momento.autor}</strong>
                  <p>{momento.texto}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>

      <MessagesWidget />
    </main>
  )
}
