import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { momentoService } from '../services/momentoService'
import { formatearFechaMomento } from '../utils/fechas'

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:5079/api').replace(/\/api\/?$/, '')

const normalizarMediaUrl = (url) => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${apiBaseUrl}${url.startsWith('/') ? url : `/${url}`}`
}

const inicialesDe = (texto) => (texto || 'MM').replace('@', '').slice(0, 2).toUpperCase()

const mapearMomento = (momento) => ({
  id: momento.idMomento,
  autor: momento.autor || 'Moment',
  usuario: momento.usuario || '@moment',
  avatar: momento.avatar || inicialesDe(momento.autor || momento.usuario),
  tiempo: formatearFechaMomento(momento.fechaCreacion),
  imagen: normalizarMediaUrl(momento.archivoUrl),
  tipoAdjunto: momento.tipoAdjunto,
  pensamiento: momento.texto,
  likes: Number(momento.totalMeGusta || 0).toLocaleString('es-MX'),
})

const herramientasPublicas = [
  { icono: '⌂', texto: 'Inicio' },
  { icono: '⌕', texto: 'Buscar' },
  { icono: '+', texto: 'Crear' },
  { icono: '♡', texto: 'Favoritos' },
  { icono: '✉', texto: 'Mensajes' },
]

export default function InicioPublico() {
  const navigate = useNavigate()
  const [mostrarRegistro, setMostrarRegistro] = useState(false)
  const [publicaciones, setPublicaciones] = useState([])
  const [cargando, setCargando] = useState(true)

  const pedirCuenta = () => setMostrarRegistro(true)

  useEffect(() => {
    let activo = true

    momentoService.feedPublico().then((resultado) => {
      if (!activo) return
      setPublicaciones(resultado.exito ? (resultado.datos ?? []).map(mapearMomento) : [])
      setCargando(false)
    })

    return () => { activo = false }
  }, [])

  return (
    <main className="app-shell public-shell">
      <aside className="sidebar public-sidebar">
        <div>
          <div className="brand">
            <span className="brand-mark">M</span>
            <span>Moment</span>
          </div>

          <nav className="side-nav" aria-label="Herramientas principales">
            {herramientasPublicas.map((item) => (
              <button className={`nav-item${item.texto === 'Inicio' ? ' activo' : ''}`} key={item.texto} onClick={item.texto === 'Inicio' ? undefined : pedirCuenta}>
                <span className="nav-icon">{item.icono}</span>
                <span>{item.texto}</span>
              </button>
            ))}
          </nav>
        </div>

        <span />
      </aside>

      <section className="feed" aria-label="Publicaciones publicas">
        <div className="feed-header">
          <div>
            <p className="feed-kicker">Explora Moment</p>
            <h1>Momentos recientes</h1>
          </div>
          <button className="compose-btn" onClick={pedirCuenta}>Compartir</button>
        </div>

        <div className="post-list">
          {cargando && (
            <article className="post-card feed-loading-card">
              <div className="skeleton avatar" />
              <div>
                <div className="skeleton line wide" />
                <div className="skeleton-moment" />
              </div>
            </article>
          )}

          {!cargando && publicaciones.length === 0 && (
            <section className="empty-feed">
              <span>Moment</span>
              <h2>Aún no hay momentos compartidos</h2>
              <p>Cuando la comunidad publique, los momentos recientes aparecerán aquí.</p>
              <button onClick={() => navigate('/registro')}>Crear cuenta</button>
            </section>
          )}

          {!cargando && publicaciones.map((post) => (
            <article className="post-card" key={post.id}>
              <header className="post-top">
                <div className="author">
                  <div className="author-avatar">{post.avatar}</div>
                  <div>
                    <strong>{post.autor}</strong>
                    <span>{post.usuario} · {post.tiempo}</span>
                  </div>
                </div>
                <button className="more-btn" onClick={pedirCuenta} aria-label="Mas opciones">•••</button>
              </header>

              <div className="post-image-wrap">
                {post.imagen ? (
                  post.tipoAdjunto === 'video'
                    ? <video className="post-image" src={post.imagen} controls />
                    : <img className="post-image" src={post.imagen} alt={`Momento compartido por ${post.autor}`} />
                ) : (
                  <div className="post-image post-text-only">
                    <p>{post.pensamiento}</p>
                  </div>
                )}
              </div>

              <div className="post-actions">
                <div>
                  <button onClick={pedirCuenta} aria-label="Me gusta">♡</button>
                  <button onClick={pedirCuenta} aria-label="Comentar">☰</button>
                  <button onClick={pedirCuenta} aria-label="Enviar">✉</button>
                </div>
                <button onClick={pedirCuenta} aria-label="Guardar">□</button>
              </div>

              <div className="post-body">
                <strong>{post.likes} me gusta</strong>
                <p><span>{post.usuario}</span> {post.pensamiento}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {mostrarRegistro && (
        <div className="guest-modal-backdrop" role="presentation" onClick={() => setMostrarRegistro(false)}>
          <section className="guest-modal" role="dialog" aria-modal="true" aria-label="Crear cuenta" onClick={(e) => e.stopPropagation()}>
            <span className="brand-mark">M</span>
            <h2>Crea una cuenta</h2>
            <p>Disfruta y comparte tus momentos con tus amigos.</p>
            <div>
              <button onClick={() => navigate('/registro')}>Registrarme</button>
              <button onClick={() => navigate('/login')}>Iniciar sesión</button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
