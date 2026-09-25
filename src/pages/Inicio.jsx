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

const estados = [
  ...publicaciones,
  {
    id: 5,
    autor: 'Sofia Marin',
    usuario: '@sofia.m',
    avatar: 'SM',
    tiempo: 'Hace 3 h',
    imagen: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
    pensamiento: 'A veces una buena platica arregla mas que cualquier plan perfecto.',
    likes: '512',
  },
  {
    id: 6,
    autor: 'Andres Vega',
    usuario: '@andresv',
    avatar: 'AV',
    tiempo: 'Hace 4 h',
    imagen: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
    pensamiento: 'Hoy avance poquito, pero avance. Tambien cuenta.',
    likes: '389',
  },
  {
    id: 7,
    autor: 'Lucia Gomez',
    usuario: '@luciag',
    avatar: 'LG',
    tiempo: 'Hace 5 h',
    imagen: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
    pensamiento: 'Cielo bonito, audifonos puestos y cero prisa.',
    likes: '841',
  },
  {
    id: 8,
    autor: 'Grupo 5A',
    usuario: '@grupo.5a',
    avatar: '5A',
    tiempo: 'Hace 6 h',
    imagen: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
    pensamiento: 'Sobrevivimos otra semana de proyecto. Eso merece foto.',
    likes: '1,006',
  },
]

export default function Inicio() {
  const [likesActivos, setLikesActivos] = useState({})
  const [corazonesAnimados, setCorazonesAnimados] = useState({})
  const [estadoAbierto, setEstadoAbierto] = useState(null)
  const [crearAbierto, setCrearAbierto] = useState(false)
  const [tipoMomento, setTipoMomento] = useState('foto')
  const [previewMomento, setPreviewMomento] = useState('')
  const [textoMomento, setTextoMomento] = useState('')

  const seleccionarArchivo = (e) => {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    setPreviewMomento(URL.createObjectURL(archivo))
  }

  const cerrarCrearMomento = () => {
    setCrearAbierto(false)
    setPreviewMomento('')
    setTextoMomento('')
    setTipoMomento('foto')
  }

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
          <button className="compose-btn" onClick={() => setCrearAbierto(true)}>Compartir</button>
        </div>

        <div className="stories" aria-label="Historias">
          {estados.map((post) => (
            <button className="story" key={post.id} onClick={() => setEstadoAbierto(post)}>
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

      {estadoAbierto && (
        <div className="story-viewer" role="presentation" onClick={() => setEstadoAbierto(null)}>
          <section className="story-modal" role="dialog" aria-modal="true" aria-label={`Momento de ${estadoAbierto.autor}`} onClick={(e) => e.stopPropagation()}>
            <header className="story-modal-head">
              <div className="author">
                <div className="author-avatar">{estadoAbierto.avatar}</div>
                <div>
                  <strong>{estadoAbierto.autor}</strong>
                  <span>{estadoAbierto.usuario} · {estadoAbierto.tiempo}</span>
                </div>
              </div>
              <button onClick={() => setEstadoAbierto(null)} aria-label="Cerrar momento">×</button>
            </header>

            <div className="story-modal-media">
              <img src={estadoAbierto.imagen} alt={`Momento compartido por ${estadoAbierto.autor}`} />
              <p>{estadoAbierto.pensamiento}</p>
            </div>

            <div className="story-modal-actions">
              <button
                className={likesActivos[`estado-${estadoAbierto.id}`] ? 'liked' : ''}
                onClick={() => alternarLike(`estado-${estadoAbierto.id}`)}
              >
                {likesActivos[`estado-${estadoAbierto.id}`] ? '♥' : '♡'} Me gusta
              </button>
              <input placeholder={`Responder a ${estadoAbierto.autor.split(' ')[0]} en privado...`} />
              <button>Enviar</button>
            </div>
          </section>
        </div>
      )}

      {crearAbierto && (
        <div className="create-moment-backdrop" role="presentation" onClick={cerrarCrearMomento}>
          <section className="create-moment" role="dialog" aria-modal="true" aria-label="Crear momento" onClick={(e) => e.stopPropagation()}>
            <header className="create-moment-head">
              <div>
                <p className="feed-kicker">Nuevo momento</p>
                <h2>Compartir algo</h2>
              </div>
              <button onClick={cerrarCrearMomento} aria-label="Cerrar creador">×</button>
            </header>

            <div className="moment-type-tabs">
              {['foto', 'video', 'texto'].map((tipo) => (
                <button
                  className={tipoMomento === tipo ? 'activo' : ''}
                  key={tipo}
                  onClick={() => {
                    setTipoMomento(tipo)
                    setPreviewMomento('')
                  }}
                >
                  {tipo}
                </button>
              ))}
            </div>

            {tipoMomento !== 'texto' ? (
              <label className="moment-upload">
                <input type="file" accept={tipoMomento === 'foto' ? 'image/*' : 'video/*'} onChange={seleccionarArchivo} hidden />
                {previewMomento ? (
                  tipoMomento === 'foto'
                    ? <img src={previewMomento} alt="Vista previa del momento" />
                    : <video src={previewMomento} controls />
                ) : (
                  <span>{tipoMomento === 'foto' ? 'Subir foto' : 'Subir video'}</span>
                )}
              </label>
            ) : (
              <div className="text-moment-preview">
                {textoMomento || 'Escribe un pensamiento para compartirlo como momento.'}
              </div>
            )}

            <textarea
              value={textoMomento}
              onChange={(e) => setTextoMomento(e.target.value)}
              placeholder={tipoMomento === 'texto' ? '¿Qué estás pensando?' : 'Agrega un mensaje para este momento...'}
              maxLength={180}
            />

            <div className="create-moment-actions">
              <small>{textoMomento.length}/180</small>
              <button onClick={cerrarCrearMomento}>Publicar momento</button>
            </div>
          </section>
        </div>
      )}

      <MessagesWidget />
    </main>
  )
}
