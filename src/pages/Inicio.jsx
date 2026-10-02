import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import MessagesWidget from '../components/MessagesWidget'
import SuccessPop from '../components/SuccessPop'
import { useAuth } from '../context/AuthContext'
import { momentoService } from '../services/momentoService'
import { reporteService } from '../services/reporteService'
import { formatearFechaMomento } from '../utils/fechas'

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:5079/api').replace(/\/api\/?$/, '')

const normalizarMediaUrl = (url) => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${apiBaseUrl}${url.startsWith('/') ? url : `/${url}`}`
}

const inicialesDe = (texto) => (texto || 'MM').replace('@', '').slice(0, 2).toUpperCase()

const motivosReporte = [
  { id: 'spam', texto: 'Spam' },
  { id: 'acoso', texto: 'Acoso' },
  { id: 'odio', texto: 'Odio' },
  { id: 'suplantacion', texto: 'Suplantación' },
  { id: 'contenido_inapropiado', texto: 'Contenido inapropiado' },
  { id: 'violencia', texto: 'Violencia' },
  { id: 'otro', texto: 'Otro' },
]

const mapearMomento = (momento) => ({
  id: momento.idMomento,
  idUsuario: momento.idUsuario,
  autor: momento.autor || 'Moment',
  usuario: momento.usuario || '@moment',
  avatar: momento.avatar || inicialesDe(momento.autor || momento.usuario),
  tiempo: formatearFechaMomento(momento.fechaCreacion),
  imagen: normalizarMediaUrl(momento.archivoUrl),
  tipoAdjunto: momento.tipoAdjunto,
  linkUrl: momento.linkUrl,
  pensamiento: momento.texto,
  likes: momento.totalMeGusta ?? 0,
  comentarios: String(momento.totalComentarios ?? 0),
  leGusta: Boolean(momento.leGusta),
  real: true,
})

export default function Inicio() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { usuario } = useAuth()
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
  const [menuPostAbierto, setMenuPostAbierto] = useState(null)
  const [momentoAEliminar, setMomentoAEliminar] = useState(null)
  const [momentoAReportar, setMomentoAReportar] = useState(null)
  const [motivoReporte, setMotivoReporte] = useState('spam')
  const [detalleReporte, setDetalleReporte] = useState('')
  const [eliminandoMomento, setEliminandoMomento] = useState(false)
  const [enviandoReporte, setEnviandoReporte] = useState(false)
  const [errorReporte, setErrorReporte] = useState('')
  const [popExito, setPopExito] = useState('')

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
    if (searchParams.get('crear') !== '1') return

    setCrearAbierto(true)
    navigate('/inicio', { replace: true })
  }, [navigate, searchParams])

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

  const actualizarMeGustaEnFeed = (id, resultado) => {
    setFeed((actual) => actual.map((post) => (
      post.id === id
        ? { ...post, leGusta: resultado.leGusta, likes: resultado.totalMeGusta }
        : post
    )))

    setEstadoAbierto((actual) => (
      actual?.id === id
        ? { ...actual, leGusta: resultado.leGusta, likes: resultado.totalMeGusta }
        : actual
    ))
  }

  const alternarLike = async (id) => {
    const respuesta = await momentoService.alternarMeGusta(id)
    if (!respuesta.exito || !respuesta.datos) return

    actualizarMeGustaEnFeed(id, respuesta.datos)
    if (respuesta.datos.leGusta) animarCorazon(id)
  }

  const darLikeConDobleClick = (id) => {
    const post = feed.find((item) => item.id === id)
    if (!post?.leGusta) alternarLike(id)
    else animarCorazon(id)
  }

  const totalLikes = (likes) => Number(likes || 0).toLocaleString('en-US')
  const esMomentoPropio = (post) => Number(post.idUsuario) === Number(usuario?.idUsuario)

  const confirmarEliminarMomento = async () => {
    if (!momentoAEliminar) return

    setEliminandoMomento(true)
    const respuesta = await momentoService.eliminar(momentoAEliminar.id)
    setEliminandoMomento(false)

    if (!respuesta.exito) return

    setFeed((actual) => actual.filter((post) => post.id !== momentoAEliminar.id))
    setEstadoAbierto((actual) => actual?.id === momentoAEliminar.id ? null : actual)
    setMomentoAEliminar(null)
    setMenuPostAbierto(null)
  }

  const confirmarReporteMomento = async () => {
    if (!momentoAReportar || enviandoReporte) return

    setEnviandoReporte(true)
    setErrorReporte('')
    const respuesta = await reporteService.momento({ idMomento: momentoAReportar.id, motivo: motivoReporte, detalle: detalleReporte })
    setEnviandoReporte(false)

    if (!respuesta.exito) {
      setErrorReporte(respuesta.mensaje || 'Ups, algo salió mal. Inténtalo más tarde')
      return
    }

    setMomentoAReportar(null)
    setMotivoReporte('spam')
    setDetalleReporte('')
    setPopExito('Reporte enviado')
    window.setTimeout(() => setPopExito(''), 1900)
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
                <button
                  className="author author-link"
                  onClick={() => navigate(`/perfil/${post.usuario.replace('@', '')}`)}
                  aria-label={`Ver perfil de ${post.autor}`}
                >
                  <div className="author-avatar">{post.avatar}</div>
                  <div>
                    <strong>{post.autor}</strong>
                    <span>{post.usuario} · {post.tiempo}</span>
                  </div>
                </button>
                <div className="post-more">
                  <button
                    className="more-btn"
                    aria-label="Mas opciones"
                    onClick={() => setMenuPostAbierto((actual) => actual === post.id ? null : post.id)}
                  >
                    •••
                  </button>
                  {menuPostAbierto === post.id && (
                    <div className="post-more-menu">
                      {esMomentoPropio(post) && (
                        <button onClick={() => {
                          setMomentoAEliminar(post)
                          setMenuPostAbierto(null)
                        }}>
                          Eliminar momento
                        </button>
                      )}
                      {!esMomentoPropio(post) && (
                        <button onClick={() => {
                          setMomentoAReportar(post)
                          setErrorReporte('')
                          setDetalleReporte('')
                          setMotivoReporte('spam')
                          setMenuPostAbierto(null)
                        }}>
                          Reportar momento
                        </button>
                      )}
                    </div>
                  )}
                </div>
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
                    className={post.leGusta ? 'liked' : ''}
                    aria-label={post.leGusta ? 'Quitar me gusta' : 'Me gusta'}
                    onClick={() => alternarLike(post.id)}
                  >
                    {post.leGusta ? '♥' : '♡'}
                  </button>
                  <button aria-label="Comentar">☰</button>
                  <button aria-label="Enviar">✉</button>
                </div>
                <button className="share-action" aria-label="Compartir momento" title="Compartir momento">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M14 6v3.4h-2.8c-4.8 0-7.6 2.9-8.2 8.1 1.6-2.4 4.1-3.6 7.3-3.6H14V18l7-6-7-6Z" />
                  </svg>
                </button>
              </div>

              <div className="post-body">
                <strong>{totalLikes(post.likes)} me gusta</strong>
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
                className={estadoAbierto.leGusta ? 'liked' : ''}
                onClick={() => alternarLike(estadoAbierto.id)}
              >
                {estadoAbierto.leGusta ? '♥' : '♡'} Me gusta
              </button>
              <input placeholder={`Responder a ${estadoAbierto.autor.split(' ')[0]} en privado...`} />
              <button>Enviar</button>
            </div>
          </section>
        </div>
      )}

      {momentoAEliminar && (
        <div className="confirm-backdrop" role="presentation" onClick={() => setMomentoAEliminar(null)}>
          <section className="confirm-modal" role="dialog" aria-modal="true" aria-label="Eliminar momento" onClick={(e) => e.stopPropagation()}>
            <h2>Eliminar momento</h2>
            <p>Este momento dejará de verse en tu perfil y en el feed.</p>
            <div>
              <button className="profile-btn" onClick={() => setMomentoAEliminar(null)} disabled={eliminandoMomento}>Cancelar</button>
              <button className="profile-btn danger" onClick={confirmarEliminarMomento} disabled={eliminandoMomento}>
                {eliminandoMomento ? <span className="spinner" aria-hidden="true" /> : 'Eliminar'}
              </button>
            </div>
          </section>
        </div>
      )}

      {momentoAReportar && (
        <div className="confirm-backdrop" role="presentation" onClick={() => setMomentoAReportar(null)}>
          <section className="confirm-modal report-modal" role="dialog" aria-modal="true" aria-label="Reportar momento" onClick={(e) => e.stopPropagation()}>
            <h2>Reportar momento</h2>
            <p>Selecciona el motivo para que moderación pueda revisarlo.</p>
            <div className="report-reasons" role="group" aria-label="Motivo del reporte">
              {motivosReporte.map((motivo) => (
                <button
                  className={motivoReporte === motivo.id ? 'activo' : ''}
                  key={motivo.id}
                  onClick={() => setMotivoReporte(motivo.id)}
                >
                  {motivo.texto}
                </button>
              ))}
            </div>
            <div className="report-detail-field">
              <textarea
                value={detalleReporte}
                onChange={(e) => setDetalleReporte(e.target.value.slice(0, 500))}
                placeholder="Detalle opcional"
                maxLength={500}
                disabled={enviandoReporte}
              />
              <small>{detalleReporte.length}/500</small>
            </div>
            {errorReporte && <p className="report-error">{errorReporte}</p>}
            <div>
              <button className="profile-btn" onClick={() => setMomentoAReportar(null)} disabled={enviandoReporte}>Cancelar</button>
              <button className="profile-btn primary" onClick={confirmarReporteMomento} disabled={enviandoReporte}>
                {enviandoReporte ? <span className="spinner" aria-hidden="true" /> : 'Enviar reporte'}
              </button>
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

      <SuccessPop visible={Boolean(popExito)} mensaje={popExito} />

      <MessagesWidget />
    </main>
  )
}
