import { useState } from 'react'
import AppSidebar from '../components/AppSidebar'
import MessagesWidget from '../components/MessagesWidget'

const publicaciones = [
  {
    id: 1,
    autor: 'Valeria Cruz',
    usuario: '@vale.cruz',
    avatar: 'VC',
    tiempo: 'Hace 12 min',
    imagen: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    pensamiento: 'Hay dias que solo necesitan luz bonita, buena musica y alguien con quien reirse sin mirar el reloj.',
    likes: '1,284',
    comentarios: '86',
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
    comentarios: '41',
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
    comentarios: '132',
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
    comentarios: '25',
  },
]

export default function Inicio() {
  const [likesActivos, setLikesActivos] = useState({})
  const [corazonesAnimados, setCorazonesAnimados] = useState({})

  const animarCorazon = (id) => {
    setCorazonesAnimados((actual) => ({ ...actual, [id]: (actual[id] || 0) + 1 }))
  }

  const alternarLike = (id) => {
    setLikesActivos((actual) => ({ ...actual, [id]: !actual[id] }))
    animarCorazon(id)
  }

  const darLikeConDobleClick = (id) => {
    setLikesActivos((actual) => ({ ...actual, [id]: true }))
    animarCorazon(id)
  }

  const totalLikes = (likes, activo) => {
    const total = Number(likes.replace(/,/g, '')) + (activo ? 1 : 0)
    return total.toLocaleString('en-US')
  }

  return (
    <main className="app-shell">
      <AppSidebar activo="Inicio" />

      <section className="feed" aria-label="Publicaciones">
        <div className="feed-header">
          <div>
            <p className="feed-kicker">Hoy en tu escuela</p>
            <h1>Momentos recientes</h1>
          </div>
          <button className="compose-btn">Compartir</button>
        </div>

        <div className="stories" aria-label="Historias">
          {publicaciones.map((post) => (
            <button className="story" key={post.id}>
              <span>{post.avatar}</span>
              <small>{post.autor.split(' ')[0]}</small>
            </button>
          ))}
        </div>

        <div className="post-list">
          {publicaciones.map((post) => (
            <article className="post-card" key={post.id}>
              <header className="post-top">
                <div className="author">
                  <div className="author-avatar">{post.avatar}</div>
                  <div>
                    <strong>{post.autor}</strong>
                    <span>{post.usuario} · {post.tiempo}</span>
                  </div>
                </div>
                <button className="more-btn" aria-label="Mas opciones">•••</button>
              </header>

              <div className="post-image-wrap" onDoubleClick={() => darLikeConDobleClick(post.id)}>
                <img className="post-image" src={post.imagen} alt={`Momento compartido por ${post.autor}`} />
                <span className="double-like-heart" key={corazonesAnimados[post.id] || 0}>♥</span>
              </div>

              <div className="post-actions">
                <div>
                  <button
                    className={likesActivos[post.id] ? 'liked' : ''}
                    aria-label={likesActivos[post.id] ? 'Quitar me gusta' : 'Me gusta'}
                    onClick={() => alternarLike(post.id)}
                  >
                    {likesActivos[post.id] ? '♥' : '♡'}
                  </button>
                  <button aria-label="Comentar">☰</button>
                  <button aria-label="Enviar">✉</button>
                </div>
                <button aria-label="Guardar">□</button>
              </div>

              <div className="post-body">
                <strong>{totalLikes(post.likes, likesActivos[post.id])} me gusta</strong>
                <p><span>{post.usuario}</span> {post.pensamiento}</p>
                <button className="comments-btn">Ver {post.comentarios} comentarios</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <MessagesWidget />
    </main>
  )
}
