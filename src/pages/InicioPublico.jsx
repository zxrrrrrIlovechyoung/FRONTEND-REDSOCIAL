import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const publicacionesPublicas = [
  {
    id: 1,
    autor: 'Valeria Cruz',
    usuario: '@vale.cruz',
    avatar: 'VC',
    tiempo: 'Hace 12 min',
    imagen: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    pensamiento: 'Hay dias que solo necesitan luz bonita, buena musica y alguien con quien reirse sin mirar el reloj.',
    likes: '1,284',
  },
  {
    id: 2,
    autor: 'Mateo Rios',
    usuario: '@mateorios',
    avatar: 'MR',
    tiempo: 'Hace 38 min',
    imagen: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1200&q=80',
    pensamiento: 'Me gusta pensar que crecer tambien es aprender a caminar mas lento cuando algo vale la pena.',
    likes: '943',
  },
  {
    id: 3,
    autor: 'Camila Torres',
    usuario: '@cami.t',
    avatar: 'CT',
    tiempo: 'Hace 1 h',
    imagen: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80',
    pensamiento: 'Un recuerdo no tiene que ser perfecto para quedarse contigo. A veces basta con que haya sido real.',
    likes: '2,019',
  },
  {
    id: 4,
    autor: 'Diego Luna',
    usuario: '@diegoluna',
    avatar: 'DL',
    tiempo: 'Hace 2 h',
    imagen: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    pensamiento: 'Entre tarea, amigos y planes que cambian, tambien estamos construyendo quienes queremos ser.',
    likes: '718',
  },
]

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

  const pedirCuenta = () => setMostrarRegistro(true)

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
          {[...publicacionesPublicas, ...publicacionesPublicas].map((post, index) => (
            <article className="post-card" key={`${post.id}-${index}`}>
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
                <img className="post-image" src={post.imagen} alt={`Momento compartido por ${post.autor}`} />
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
