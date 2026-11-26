import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import MessagesWidget from '../components/MessagesWidget'
import SuccessPop from '../components/SuccessPop'
import UserTrustBadge from '../components/UserTrustBadge'
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
const esUrlAvatar = (avatar) => /^https?:\/\//i.test(avatar || '') || String(avatar || '').startsWith('/')

const motivosReporte = [
  { id: 'spam', texto: 'Spam' },
  { id: 'acoso', texto: 'Acoso' },
  { id: 'odio', texto: 'Odio' },
  { id: 'suplantacion', texto: 'Suplantación' },
  { id: 'contenido_inapropiado', texto: 'Contenido inapropiado' },
  { id: 'violencia', texto: 'Violencia' },
  { id: 'otro', texto: 'Otro' },
]

const obtenerImagenes = (archivoUrl) => {
  if (!archivoUrl) return []
  try {
    const valor = JSON.parse(archivoUrl)
    if (Array.isArray(valor)) return valor.map(normalizarMediaUrl)
  } catch {}
  return [normalizarMediaUrl(archivoUrl)]
}

const mapearMomento = (momento) => ({
  id: momento.idMomento,
  idUsuario: momento.idUsuario,
  autor: momento.autor || 'Moment',
  usuario: momento.usuario || '@moment',
  avatar: momento.avatar || inicialesDe(momento.autor || momento.usuario),
  esVerificado: Boolean(momento.esVerificado),
  esModerador: Boolean(momento.esModerador),
  tiempo: formatearFechaMomento(momento.fechaCreacion),
  imagenes: obtenerImagenes(momento.archivoUrl),
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
  const [previewMomento, setPreviewMomento] = useState([])
  const [archivosMomento, setArchivosMomento] = useState([])
  const [imagenArrastrada, setImagenArrastrada] = useState(null)
  const [imagenModal, setImagenModal] = useState(null)
  const [indiceImagen, setIndiceImagen] = useState({})
  const [ocultarIndicadores, setOcultarIndicadores] = useState(false)
  const indicadorTimer = useRef(null)

  const iniciarMantenerImagen = () => {
    window.clearTimeout(indicadorTimer.current)
    indicadorTimer.current = window.setTimeout(() => setOcultarIndicadores(true), 260)
  }

  const terminarMantenerImagen = () => {
    window.clearTimeout(indicadorTimer.current)
    setOcultarIndicadores(false)
  }
  const [textoMomento, setTextoMomento] = useState('')
  const [linkMomento, setLinkMomento] = useState('')
  const [feed, setFeed] = useState([])
  const [cargandoFeed, setCargandoFeed] = useState(true)
  const [actualizandoFeed, setActualizandoFeed] = useState(false)
  const [distanciaPull, setDistanciaPull] = useState(0)
  const inicioPullRef = useRef(null)
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
  const [comentarioRapidoAbierto, setComentarioRapidoAbierto] = useState({})
  const [comentariosPantalla, setComentariosPantalla] = useState(null)
  const [comentariosCerrando, setComentariosCerrando] = useState(false)
  const [comentariosPorMomento, setComentariosPorMomento] = useState({})
  const [comentarioTexto, setComentarioTexto] = useState({})
  const [comentariosCargando, setComentariosCargando] = useState({})
  const [comentariosPublicando, setComentariosPublicando] = useState({})
  const [comentariosError, setComentariosError] = useState({})
  const [respuestasPorComentario, setRespuestasPorComentario] = useState({})
  const [respuestasCargando, setRespuestasCargando] = useState({})
  const [respondiendoA, setRespondiendoA] = useState(null)

  const seleccionarArchivo = (e) => {
    const nuevosArchivos = Array.from(e.target.files ?? [])
    if (!nuevosArchivos.length) return
    const total = archivosMomento.length + nuevosArchivos.length
    if (total > 10) { setErrorCrear('Puedes seleccionar hasta 10 imágenes.'); return }
    setArchivosMomento((actuales) => [...actuales, ...nuevosArchivos])
    setPreviewMomento((actuales) => [...actuales, ...nuevosArchivos.map((archivo) => URL.createObjectURL(archivo))])
    e.target.value = ''
  }

  const eliminarImagenMomento = (indice) => {
    setArchivosMomento((actuales) => actuales.filter((_, posicion) => posicion !== indice))
    setPreviewMomento((actuales) => actuales.filter((_, posicion) => posicion !== indice))
  }

  const moverImagenMomento = (indiceDestino) => {
    if (imagenArrastrada === null || imagenArrastrada === indiceDestino) return
    setArchivosMomento((actuales) => {
      const siguiente = [...actuales]
      const [movida] = siguiente.splice(imagenArrastrada, 1)
      siguiente.splice(indiceDestino, 0, movida)
      return siguiente
    })
    setPreviewMomento((actuales) => {
      const siguiente = [...actuales]
      const [movida] = siguiente.splice(imagenArrastrada, 1)
      siguiente.splice(indiceDestino, 0, movida)
      return siguiente
    })
    setImagenArrastrada(null)
  }

  const cerrarCrearMomento = () => {
    setCrearAbierto(false)
    setPreviewMomento([])
    setArchivosMomento([])
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
    const overflowOriginal = document.body.style.overflow
    if (comentariosPantalla) document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = overflowOriginal
    }
  }, [comentariosPantalla])

  useEffect(() => {
    if (searchParams.get('crear') !== '1') return

    setCrearAbierto(true)
    navigate('/inicio', { replace: true })
  }, [navigate, searchParams])

  const cargarFeed = async (inicial = false) => {
    if (inicial) setCargandoFeed(true)
    else setActualizandoFeed(true)

    const respuesta = await momentoService.feed()
    if (respuesta.exito) setFeed((respuesta.datos ?? []).map(mapearMomento))

    if (inicial) setCargandoFeed(false)
    else setActualizandoFeed(false)
  }

  useEffect(() => {
    let activo = true

    const cargarFeedInicial = async () => {
      setCargandoFeed(true)
      const respuesta = await momentoService.feed()
      if (!activo) return

      setFeed(respuesta.exito ? (respuesta.datos ?? []).map(mapearMomento) : [])
      setCargandoFeed(false)
    }

    cargarFeedInicial()
    return () => {
      activo = false
    }
  }, [])

  const iniciarPull = (event) => {
    if (window.scrollY > 0 || actualizandoFeed || cargandoFeed || crearAbierto) return
    inicioPullRef.current = event.touches[0]?.clientY ?? null
  }

  const moverPull = (event) => {
    if (inicioPullRef.current === null || window.scrollY > 0) return

    const desplazamiento = (event.touches[0]?.clientY ?? 0) - inicioPullRef.current
    if (desplazamiento <= 0) {
      setDistanciaPull(0)
      return
    }

    if (desplazamiento > 8) event.preventDefault()
    setDistanciaPull(Math.min(desplazamiento * 0.45, 96))
  }

  const terminarPull = () => {
    const debeActualizar = distanciaPull >= 58
    inicioPullRef.current = null
    setDistanciaPull(0)
    if (debeActualizar) cargarFeed()
  }

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

  const mapearComentario = (comentario) => ({
    id: comentario.idComentario,
    idUsuario: comentario.idUsuario,
    autor: comentario.autor || 'Moment',
    usuario: comentario.usuario || '@moment',
    avatar: comentario.avatar || inicialesDe(comentario.autor || comentario.usuario),
    texto: comentario.texto || '',
    likes: comentario.totalMeGusta ?? 0,
    leGusta: Boolean(comentario.leGusta),
    totalRespuestas: comentario.totalRespuestas ?? 0,
    idComentarioPadre: comentario.idComentarioPadre ?? null,
    tiempo: formatearFechaMomento(comentario.fechaCreacion),
  })

  const cargarComentarios = async (idMomento) => {
    setComentariosCargando((actual) => ({ ...actual, [idMomento]: true }))
    setComentariosError((actual) => ({ ...actual, [idMomento]: '' }))
    const respuesta = await momentoService.comentarios(idMomento)
    setComentariosCargando((actual) => ({ ...actual, [idMomento]: false }))

    if (!respuesta.exito) {
      setComentariosError((actual) => ({ ...actual, [idMomento]: respuesta.mensaje || 'Ups, algo salió mal. Inténtalo más tarde' }))
      return
    }

    setComentariosPorMomento((actual) => ({
      ...actual,
      [idMomento]: (respuesta.datos?.items ?? []).map(mapearComentario).reverse(),
    }))
  }

  const abrirPantallaComentarios = (post) => {
    setComentariosCerrando(false)
    setRespondiendoA(null)
    setComentariosPantalla(post)
    if (!comentariosPorMomento[post.id]) cargarComentarios(post.id)
  }

  const cerrarPantallaComentarios = () => {
    setComentariosCerrando(true)
    window.setTimeout(() => {
      setComentariosPantalla(null)
      setComentariosCerrando(false)
      setRespondiendoA(null)
    }, 220)
  }

  useEffect(() => {
    const idMomento = Number(searchParams.get('momento'))
    if (!idMomento || !feed.length) return
    const post = feed.find((item) => Number(item.id) === idMomento)
    if (!post) return
    abrirPantallaComentarios(post)
    navigate('/inicio', { replace: true })
  }, [feed, navigate, searchParams])

  const alternarComentarioRapido = (post) => {
    const siguiente = !comentarioRapidoAbierto[post.id]
    setComentarioRapidoAbierto((actual) => ({ ...actual, [post.id]: siguiente }))
    if (siguiente && !comentariosPorMomento[post.id]) cargarComentarios(post.id)
  }

  const publicarComentario = async (idMomento, idPadreForzado) => {
    const idPadre = idPadreForzado !== undefined
      ? idPadreForzado
      : (respondiendoA?.idMomento === idMomento ? respondiendoA.idComentario : null)
    const claveTexto = idPadre ? `respuesta-${idPadre}` : idMomento
    const texto = (comentarioTexto[claveTexto] || '').trim()
    if (!texto) {
      setComentariosError((actual) => ({ ...actual, [idMomento]: 'Escribe un comentario.' }))
      return
    }

    if (texto.length > 300) {
      setComentariosError((actual) => ({ ...actual, [idMomento]: 'El comentario no puede superar los 300 caracteres.' }))
      return
    }

    setComentariosPublicando((actual) => ({ ...actual, [claveTexto]: true }))
    setComentariosError((actual) => ({ ...actual, [idMomento]: '' }))
    const respuesta = await momentoService.crearComentario(idMomento, texto, idPadre)
    setComentariosPublicando((actual) => ({ ...actual, [claveTexto]: false }))

    if (!respuesta.exito || !respuesta.datos) {
      setComentariosError((actual) => ({ ...actual, [idMomento]: respuesta.mensaje || 'Ups, algo salió mal. Inténtalo más tarde' }))
      return
    }

    const comentario = mapearComentario(respuesta.datos)
    if (idPadre) {
      setRespuestasPorComentario((actual) => ({
        ...actual,
        [idPadre]: [...(actual[idPadre] ?? []), comentario],
      }))
      const actualizarRespuestas = (items) => items.map((item) => (
        item.id === idPadre
          ? { ...item, totalRespuestas: item.totalRespuestas + 1 }
          : item
      ))
      setComentariosPorMomento((actual) => ({ ...actual, [idMomento]: actualizarRespuestas(actual[idMomento] ?? []) }))
      setRespuestasPorComentario((actual) => Object.fromEntries(Object.entries(actual).map(([clave, items]) => [clave, actualizarRespuestas(items)])))
      setRespondiendoA(null)
    } else {
      setComentariosPorMomento((actual) => ({
        ...actual,
        [idMomento]: [...(actual[idMomento] ?? []), comentario],
      }))
    }
    setComentarioTexto((actual) => ({ ...actual, [claveTexto]: '' }))
    setFeed((actual) => actual.map((post) => (
      post.id === idMomento
        ? { ...post, comentarios: String(respuesta.datos.totalComentarios ?? Number(post.comentarios || 0) + 1) }
        : post
    )))
  }

  const cargarRespuestas = async (idMomento, idComentario) => {
    setRespuestasCargando((actual) => ({ ...actual, [idComentario]: true }))
    const respuesta = await momentoService.comentarios(idMomento, { padre: idComentario, cantidad: 12 })
    setRespuestasCargando((actual) => ({ ...actual, [idComentario]: false }))
    if (!respuesta.exito) return
    setRespuestasPorComentario((actual) => ({
      ...actual,
      [idComentario]: (respuesta.datos?.items ?? []).map(mapearComentario).reverse(),
    }))
  }

  const ocultarRespuestas = (idComentario) => {
    setRespuestasPorComentario((actual) => {
      const siguiente = { ...actual }
      delete siguiente[idComentario]
      return siguiente
    })
  }

  const alternarLikeComentario = async (idComentario) => {
    const respuesta = await momentoService.alternarMeGustaComentario(idComentario)
    if (!respuesta.exito || !respuesta.datos) return

    const aplicar = (items = []) => items.map((item) => (
      item.id === idComentario
        ? { ...item, leGusta: respuesta.datos.leGusta, likes: respuesta.datos.totalMeGusta }
        : item
    ))

    setComentariosPorMomento((actual) => Object.fromEntries(Object.entries(actual).map(([clave, items]) => [clave, aplicar(items)])))
    setRespuestasPorComentario((actual) => Object.fromEntries(Object.entries(actual).map(([clave, items]) => [clave, aplicar(items)])))
  }

  const renderComentario = (comentario, post, nivel = 0) => {
    const respuestas = respuestasPorComentario[comentario.id] ?? []
    const mostrandoRespuestas = respuestas.length > 0
    const estaRespondiendo = respondiendoA?.idComentario === comentario.id
    const claveRespuesta = `respuesta-${comentario.id}`

    return (
      <article
        className={`comment-thread${(mostrandoRespuestas || comentario.totalRespuestas > 0) ? ' con-respuestas' : ''}${nivel > 0 ? ' es-respuesta' : ''}`}
        key={comentario.id}
        style={{ '--nivel': Math.min(nivel, 5) }}
      >
        <div className="comment-item">
          {esUrlAvatar(comentario.avatar) ? (
            <img src={normalizarMediaUrl(comentario.avatar)} alt={comentario.autor} />
          ) : (
            <span>{comentario.avatar}</span>
          )}
          <div>
            <p><strong>{comentario.usuario}</strong> {comentario.texto}</p>
            <div className="comment-meta">
              <small>{comentario.tiempo}</small>
              <button className={comentario.leGusta ? 'liked' : ''} onClick={() => alternarLikeComentario(comentario.id)}>
                {comentario.leGusta ? '♥' : '♡'} {comentario.likes > 0 ? comentario.likes : ''}
              </button>
              <button onClick={() => setRespondiendoA({ idMomento: post.id, idComentario: comentario.id, usuario: comentario.usuario })}>
                Responder
              </button>
            </div>
          </div>
        </div>

        {comentario.totalRespuestas > 0 && !mostrandoRespuestas && (
          <button className="comment-replies-btn" onClick={() => cargarRespuestas(post.id, comentario.id)} disabled={respuestasCargando[comentario.id]}>
            {respuestasCargando[comentario.id] ? 'Cargando...' : `Ver ${comentario.totalRespuestas} respuestas`}
          </button>
        )}

        {estaRespondiendo && (
          <div className="comment-composer reply">
            <input
              value={comentarioTexto[claveRespuesta] || ''}
              onChange={(e) => setComentarioTexto((actual) => ({ ...actual, [claveRespuesta]: e.target.value.slice(0, 300) }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  publicarComentario(post.id)
                }
              }}
              placeholder={`Responder a ${comentario.usuario}`}
              maxLength={300}
              disabled={comentariosPublicando[claveRespuesta]}
            />
            <button onClick={() => publicarComentario(post.id)} disabled={comentariosPublicando[claveRespuesta]}>
              {comentariosPublicando[claveRespuesta] ? <span className="spinner" aria-hidden="true" /> : 'Responder'}
            </button>
          </div>
        )}

        {mostrandoRespuestas && (
          <div className="comment-replies">
            <button className="comment-replies-btn hide" onClick={() => ocultarRespuestas(comentario.id)}>
              Ocultar respuestas
            </button>
            {respuestas.map((respuesta) => renderComentario(respuesta, post, nivel + 1))}
          </div>
        )}
      </article>
    )
  }

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

    setPublicando(true)
    setErrorCrear('')

    const tipoAdjunto = archivosMomento.length
      ? 'foto'
      : (tipoMomento === 'link' ? 'link' : '')

    const respuesta = await momentoService.crear({
      texto,
      tipoAdjunto,
      archivos: archivosMomento,
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
    <main className={`app-shell${comentariosPantalla ? ' comments-open' : ''}`}>
      <AppSidebar activo="Inicio" />

      <section
        className="feed"
        aria-label="Publicaciones"
        onTouchStart={iniciarPull}
        onTouchMove={moverPull}
        onTouchEnd={terminarPull}
        onTouchCancel={terminarPull}
      >
        <div
          className={`feed-pull-indicator${actualizandoFeed ? ' actualizando' : ''}`}
          style={{ height: `${distanciaPull}px`, opacity: distanciaPull > 0 || actualizandoFeed ? 1 : 0 }}
          aria-live="polite"
        >
          <span className="feed-pull-icon">↻</span>
          <span>{actualizandoFeed ? 'Actualizando...' : distanciaPull >= 58 ? 'Suelta para actualizar' : 'Desliza para actualizar'}</span>
        </div>

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
                  <div className="author-avatar">
                    {esUrlAvatar(post.avatar)
                      ? <img src={normalizarMediaUrl(post.avatar)} alt={`Foto de ${post.autor}`} />
                      : <span>{post.avatar}</span>}
                  </div>
                  <div>
                    <strong>{post.autor}<UserTrustBadge verified={post.esVerificado} moderator={post.esModerador} /></strong>
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

              <div
                className="post-image-wrap"
                onDoubleClick={() => darLikeConDobleClick(post.id)}
                onPointerDown={iniciarMantenerImagen}
                onPointerUp={terminarMantenerImagen}
                onPointerCancel={terminarMantenerImagen}
                onPointerLeave={terminarMantenerImagen}
              >
                {post.imagenes?.length ? (
                  <>
                    <img className="post-image" src={post.imagenes[indiceImagen[post.id] || 0]} alt={`Momento compartido por ${post.autor}`} />
                    {post.imagenes.length > 1 && <>
                      <div
                        className="carousel-zone carousel-zone-prev"
                        role="button"
                        aria-label="Imagen anterior"
                        onClick={(e) => { e.stopPropagation(); setIndiceImagen((a) => ({ ...a, [post.id]: ((a[post.id] || 0) - 1 + post.imagenes.length) % post.imagenes.length })) }}
                      />
                      <div className="carousel-zone carousel-zone-next" role="button" aria-label="Siguiente imagen" onClick={(e) => { e.stopPropagation(); setIndiceImagen((a) => ({ ...a, [post.id]: ((a[post.id] || 0) + 1) % post.imagenes.length })) }} />
                      {!ocultarIndicadores && <div className="carousel-dots" aria-label={`Imagen ${(indiceImagen[post.id] || 0) + 1} de ${post.imagenes.length}`}>
                        {post.imagenes.map((_, indice) => <span key={indice} className={indice === (indiceImagen[post.id] || 0) ? 'activo' : ''} />)}
                      </div>}
                    </>}
                  </>
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
                  <button aria-label="Comentar" onClick={() => alternarComentarioRapido(post)}>
                    <svg className="comment-action-icon" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8 4h8a4 4 0 0 1 4 4v4a4 4 0 0 1-4 4h-4l-4 4v-4a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4Z" />
                    </svg>
                  </button>
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
                <button className="comments-btn" onClick={() => abrirPantallaComentarios(post)}>
                  Ver {post.comentarios} comentarios
                </button>
              </div>

              {comentarioRapidoAbierto[post.id] && (
                <section className="quick-comment-panel" aria-label={`Comentar momento de ${post.autor}`}>
                  <div className="comment-composer">
                    <input
                      value={comentarioTexto[post.id] || ''}
                      onChange={(e) => setComentarioTexto((actual) => ({ ...actual, [post.id]: e.target.value.slice(0, 300) }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          publicarComentario(post.id, null)
                        }
                      }}
                      placeholder="Escribe un comentario..."
                      maxLength={300}
                      disabled={comentariosPublicando[post.id]}
                    />
                    <button onClick={() => publicarComentario(post.id, null)} disabled={comentariosPublicando[post.id]}>
                      {comentariosPublicando[post.id] ? <span className="spinner" aria-hidden="true" /> : 'Publicar'}
                    </button>
                  </div>
                  {comentariosError[post.id] && <p className="comments-error">{comentariosError[post.id]}</p>}
                </section>
              )}
            </article>
          ))}
        </div>
      </section>

      {estadoAbierto && (
        <div className="story-viewer" role="presentation" onClick={() => setEstadoAbierto(null)}>
          <section className="story-modal" role="dialog" aria-modal="true" aria-label={`Momento de ${estadoAbierto.autor}`} onClick={(e) => e.stopPropagation()}>
            <header className="story-modal-head">
              <div className="author">
                <div className="author-avatar">
                  {esUrlAvatar(estadoAbierto.avatar)
                    ? <img src={normalizarMediaUrl(estadoAbierto.avatar)} alt={`Foto de ${estadoAbierto.autor}`} />
                    : <span>{estadoAbierto.avatar}</span>}
                </div>
                <div>
                  <strong>{estadoAbierto.autor}<UserTrustBadge verified={estadoAbierto.esVerificado} moderator={estadoAbierto.esModerador} /></strong>
                  <span>{estadoAbierto.usuario} · {estadoAbierto.tiempo}</span>
                </div>
              </div>
              <button onClick={() => setEstadoAbierto(null)} aria-label="Cerrar momento">×</button>
            </header>

            <div className="story-modal-media">
              {estadoAbierto.imagenes?.length ? (
                <img src={estadoAbierto.imagenes[0]} alt={`Momento compartido por ${estadoAbierto.autor}`} />
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

      {comentariosPantalla && (
        <div className={`comments-screen-backdrop${comentariosCerrando ? ' cerrando' : ''}`} role="presentation" onClick={cerrarPantallaComentarios}>
          <section className={`comments-screen${comentariosCerrando ? ' cerrando' : ''}`} role="dialog" aria-modal="true" aria-label={`Comentarios de ${comentariosPantalla.autor}`} onClick={(e) => e.stopPropagation()}>
            <header className="comments-screen-head">
              <div>
                <p className="feed-kicker">Comentarios</p>
                <h2>{comentariosPantalla.autor}</h2>
              </div>
              <button onClick={cerrarPantallaComentarios} aria-label="Cerrar comentarios">×</button>
            </header>

            <div className="comments-screen-post">
              <strong>{comentariosPantalla.usuario}</strong>
              <p>{comentariosPantalla.pensamiento}</p>
            </div>

            <div className="comments-screen-list">
              {comentariosCargando[comentariosPantalla.id] && (
                <div className="comments-skeleton">
                  <span className="skeleton avatar" />
                  <div>
                    <span className="skeleton line wide" />
                    <span className="skeleton line" />
                  </div>
                </div>
              )}

              {!comentariosCargando[comentariosPantalla.id] && (comentariosPorMomento[comentariosPantalla.id] ?? []).length === 0 && (
                <p className="comments-empty">Sé la primera persona en comentar este momento.</p>
              )}

              {(comentariosPorMomento[comentariosPantalla.id] ?? []).map((comentario) => renderComentario(comentario, comentariosPantalla))}
            </div>

            {!respondiendoA && (
              <footer className="comments-screen-composer">
                <div className="comment-composer">
                  <input
                    value={comentarioTexto[comentariosPantalla.id] || ''}
                    onChange={(e) => setComentarioTexto((actual) => ({ ...actual, [comentariosPantalla.id]: e.target.value.slice(0, 300) }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        publicarComentario(comentariosPantalla.id, null)
                      }
                    }}
                    placeholder="Escribe un comentario..."
                    maxLength={300}
                    disabled={comentariosPublicando[comentariosPantalla.id]}
                  />
                  <button onClick={() => publicarComentario(comentariosPantalla.id, null)} disabled={comentariosPublicando[comentariosPantalla.id]}>
                    {comentariosPublicando[comentariosPantalla.id] ? <span className="spinner" aria-hidden="true" /> : 'Publicar'}
                  </button>
                </div>
                {comentariosError[comentariosPantalla.id] && <p className="comments-error">{comentariosError[comentariosPantalla.id]}</p>}
              </footer>
            )}
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
                {
                  tipo: 'foto',
                  icono: <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9" r="1.5" /><path d="m4 17 4.5-4.5 3.5 3 2.5-2.5L20 17" /></svg>,
                  label: 'Agregar imágenes',
                },
                { tipo: 'link', icono: '↗', label: 'Link' },
              ].map((item) => (
                <button
                  className={tipoMomento === item.tipo || (item.tipo === 'foto' && previewMomento.length) ? 'activo' : ''}
                  key={item.tipo}
                  onClick={() => {
                    if (item.tipo === 'foto') {
                      setTipoMomento('foto')
                      setLinkMomento('')
                      return
                    }

                    setTipoMomento(tipoMomento === item.tipo ? '' : item.tipo)
                    setLinkMomento('')
                  }}
                  title={item.label}
                  type="button"
                >
                  <span>{item.icono}</span>
                </button>
              ))}
            </div>

            <>
              <label className="moment-upload">
                <input type="file" accept="image/*,.heic,.heif" multiple onChange={seleccionarArchivo} hidden />
                {previewMomento.length ? (
                  <>
                    <div className="moment-upload-cover-actions">
                      <span className="moment-upload-more">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="12" height="12" rx="1.5" /><path d="M8 2h11a3 3 0 0 1 3 3v11" /><path d="m7 14 3-3 2.5 2 2-2 2.5 3" /></svg>
                        Agregar imagen
                      </span>
                      {previewMomento.length === 1 && (
                        <button type="button" className="moment-upload-delete" aria-label="Eliminar imagen principal" onClick={(e) => { e.preventDefault(); e.stopPropagation(); eliminarImagenMomento(0) }}>
                          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
                        </button>
                      )}
                    </div>
                    {previewMomento.length === 1 ? (
                      <div className="moment-upload-cover">
                        <img src={previewMomento[0]} alt="Vista previa principal del momento" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImagenModal(previewMomento[0]) }} />
                      </div>
                    ) : (
                      <div className="moment-upload-grid">
                        {previewMomento.map((src, indice) => (
                          <div
                            className="moment-upload-thumb"
                            key={src}
                            draggable
                            onDragStart={() => setImagenArrastrada(indice)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => moverImagenMomento(indice)}
                          >
                            <img src={src} alt={`Vista previa ${indice + 1} del momento`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImagenModal(src) }} />
                            <button
                              type="button"
                              className="moment-upload-thumb-delete"
                              aria-label={`Eliminar imagen ${indice + 1}`}
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); eliminarImagenMomento(indice) }}
                            >
                              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
                            </button>
                            <span>{indice + 1}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <span>Agregar imagen</span>
                )}
              </label>
            </>

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

      {imagenModal && (
        <div className="moment-image-modal-backdrop" role="presentation" onClick={() => setImagenModal(null)}>
          <section className="moment-image-modal" role="dialog" aria-modal="true" aria-label="Vista previa de imagen" onClick={(e) => e.stopPropagation()}>
            <button type="button" aria-label="Cerrar vista previa" onClick={() => setImagenModal(null)}>×</button>
            <img src={imagenModal} alt="Vista ampliada de la imagen seleccionada" />
          </section>
        </div>
      )}

      <SuccessPop visible={Boolean(popExito)} mensaje={popExito} />

      <MessagesWidget />
    </main>
  )
}
