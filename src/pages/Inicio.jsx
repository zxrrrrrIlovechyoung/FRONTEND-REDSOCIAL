import { useEffect, useState } from 'react'
import AppSidebar from '../components/AppSidebar'
import MessagesWidget from '../components/MessagesWidget'
import { momentoService } from '../services/momentoService'

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:5079/api').replace(/\/api\/?$/, '')

const normalizarMediaUrl = (url) => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${apiBaseUrl}${url.startsWith('/') ? url : `/${url}`}`
}

const inicialesDe = (texto) => (texto || 'MM').replace('@', '').slice(0, 2).toUpperCase()

const tiempoRelativo = (fecha) => {
  const diff = Date.now() - new Date(fecha).getTime()
  const minutos = Math.max(1, Math.floor(diff / 60000))
  if (minutos < 60) return `Hace ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `Hace ${horas} h`
  return `Hace ${Math.floor(horas / 24)} d`
}

const mapearMomento = (momento) => ({
  id: momento.idMomento,
  autor: momento.autor || 'Moment',
  usuario: momento.usuario || '@moment',
  avatar: momento.avatar || inicialesDe(momento.autor || momento.usuario),
  tiempo: tiempoRelativo(momento.fechaCreacion),
  imagen: normalizarMediaUrl(momento.archivoUrl),
  tipoAdjunto: momento.tipoAdjunto,
  linkUrl: momento.linkUrl,
  pensamiento: momento.texto,
  likes: String(momento.totalMeGusta ?? 0),
  comentarios: String(momento.totalComentarios ?? 0),
  real: true,
})

export default function Inicio() {
  const [likesActivos, setLikesActivos] = useState({})
  const [corazonesAnimados, setCorazonesAnimados] = useState({})
  const [estadoAbierto, setEstadoAbierto] = useState(null)
  const [crearAbierto, setCrearAbierto] = useState(false)
  const [tipoMomento, setTipoMomento] = useState('')
  const [previewMomento, setPreviewMomento] = useState('')
  const [archivoMomento, setArchivoMomento] = useState(null)
  const [textoMomento, setTextoMomento] = useState('')
  const [linkMomento, setLinkMomento] = useState('')
  const [feed, setFeed] = useState([])
  const [cargandoFeed, setCargandoFeed] = useState(true)
  const [publicando, setPublicando] = useState(false)
  const [errorCrear, setErrorCrear] = useState('')

  const seleccionarArchivo = (e) => {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    setArchivoMomento(archivo)
    setPreviewMomento(URL.createObjectURL(archivo))
  }

  const cerrarCrearMomento = () => {
    setCrearAbierto(false)
    setPreviewMomento('')
    setArchivoMomento(null)
    setTextoMomento('')
    setLinkMomento('')
    setTipoMomento('')
    setErrorCrear('')
  }

  useEffect(() => {
    const abrirCrear = () => setCrearAbierto(true)
    window.addEventListener('abrir-crear-momento', abrirCrear)
    return () => window.removeEventListener('abrir-crear-momento', abrirCrear)
  }, [])

  useEffect(() => {
    let activo = true

    const cargarFeed = async () => {
      setCargandoFeed(true)
      const respuesta = await momentoService.feed()
      if (!activo) return

      setFeed(respuesta.exito ? (respuesta.datos ?? []).map(mapearMomento) : [])

      setCargandoFeed(false)
    }

    cargarFeed()
    return () => {
      activo = false
    }
  }, [])

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

  const publicarMomento = async () => {
    const texto = textoMomento.trim()
    if (!texto) {
      setErrorCrear('Cuéntanos qué quieres compartir.')
      return
    }

    if ((tipoMomento === 'foto' || tipoMomento === 'video') && !archivoMomento) {
      setErrorCrear(`Selecciona ${tipoMomento === 'foto' ? 'una foto' : 'un video'} para compartir.`)
      return
    }

    setPublicando(true)
    setErrorCrear('')

    const respuesta = await momentoService.crear({
      texto,
      tipoAdjunto: tipoMomento,
      archivo: archivoMomento,
      linkUrl: linkMomento.trim(),
    })

    setPublicando(false)

    if (!respuesta.exito) {
      setErrorCrear(respuesta.mensaje || 'Ups, algo salió mal. Inténtalo más tarde')
      return
    }

    if (respuesta.datos) {
      setFeed((actual) => [mapearMomento(respuesta.datos), ...actual])
    }

    cerrarCrearMomento()
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

        {feed.length > 0 && (
          <div className="stories" aria-label="Historias">
            {feed.slice(0, 8).map((post) => (
              <button className="story" key={post.id} onClick={() => setEstadoAbierto(post)}>
                <span>{post.avatar}</span>
                <small>{post.autor.split(' ')[0]}</small>
              </button>
            ))}
          </div>
        )}

        <div className="post-list">
          {cargandoFeed && (
            <article className="post-card feed-loading-card">
              <div className="skeleton avatar" />
              <div>
                <div className="skeleton line wide" />
                <div className="skeleton-moment" />
              </div>
            </article>
          )}

          {!cargandoFeed && feed.length === 0 && (
            <section className="empty-feed">
              <span>Moment</span>
              <h2>Aún no hay momentos compartidos</h2>
              <p>Sé la primera persona en compartir algo con tu escuela.</p>
              <button onClick={() => setCrearAbierto(true)}>Crear momento</button>
            </section>
          )}

          {feed.map((post) => (
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
                {post.imagen ? (
                  post.tipoAdjunto === 'video'
                    ? <video className="post-image" src={post.imagen} controls />
                    : <img className="post-image" src={post.imagen} alt={`Momento compartido por ${post.autor}`} />
                ) : (
                  <div className="post-image post-text-only">
                    <p>{post.pensamiento}</p>
                  </div>
                )}
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
                {post.linkUrl && <a className="post-link" href={post.linkUrl} target="_blank" rel="noreferrer">Abrir enlace</a>}
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
              {estadoAbierto.imagen ? (
                estadoAbierto.tipoAdjunto === 'video'
                  ? <video src={estadoAbierto.imagen} controls />
                  : <img src={estadoAbierto.imagen} alt={`Momento compartido por ${estadoAbierto.autor}`} />
              ) : (
                <div className="story-text-only">{estadoAbierto.pensamiento}</div>
              )}
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

            <div className="moment-text-field">
              <textarea
                value={textoMomento}
                onChange={(e) => setTextoMomento(e.target.value)}
                placeholder="¿Qué quieres compartir?"
                maxLength={180}
                required
              />
              <small>{textoMomento.length}/180</small>
            </div>

            <div className="moment-attach-row" aria-label="Agregar adjunto">
              {[
                { tipo: 'foto', icono: '▧', label: 'Imagen' },
                { tipo: 'video', icono: '▷', label: 'Video' },
                { tipo: 'link', icono: '↗', label: 'Link' },
              ].map((item) => (
                <button
                  className={tipoMomento === item.tipo ? 'activo' : ''}
                  key={item.tipo}
                  onClick={() => {
                    setTipoMomento(tipoMomento === item.tipo ? '' : item.tipo)
                    setPreviewMomento('')
                    setArchivoMomento(null)
                    setLinkMomento('')
                  }}
                  title={item.label}
                  type="button"
                >
                  <span>{item.icono}</span>
                </button>
              ))}
            </div>

            {(tipoMomento === 'foto' || tipoMomento === 'video') && (
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
            )}

            {tipoMomento === 'link' && (
              <div className="moment-link-field">
                <input
                  value={linkMomento}
                  onChange={(e) => setLinkMomento(e.target.value)}
                  placeholder="Pega un enlace para acompañar tu momento"
                />
              </div>
            )}

            <div className="create-moment-actions">
              {errorCrear && <span className="create-moment-error">{errorCrear}</span>}
              <button onClick={publicarMomento} disabled={publicando}>
                {publicando ? <span className="spinner" aria-hidden="true" /> : 'Publicar momento'}
              </button>
            </div>
          </section>
        </div>
      )}

      <MessagesWidget />
    </main>
  )
}
