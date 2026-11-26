import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import AppSidebar from '../components/AppSidebar'
import MessagesWidget from '../components/MessagesWidget'
import SuccessPop from '../components/SuccessPop'
import UserTrustBadge from '../components/UserTrustBadge'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import { authService } from '../services/authService'
import { momentoService } from '../services/momentoService'
import { formatearFechaMomento } from '../utils/fechas'

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:5079/api').replace(/\/api\/?$/, '')

const normalizarMediaUrl = (url) => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${apiBaseUrl}${url.startsWith('/') ? url : `/${url}`}`
}

const IconoPersona = () => <svg className="default-profile-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.2" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></svg>

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
  texto: momento.texto,
  imagenes: obtenerImagenes(momento.archivoUrl),
  tipoAdjunto: momento.tipoAdjunto,
  linkUrl: momento.linkUrl,
  likes: momento.totalMeGusta ?? 0,
  comentarios: momento.totalComentarios ?? 0,
  leGusta: Boolean(momento.leGusta),
  esVerificado: Boolean(momento.esVerificado),
  esModerador: Boolean(momento.esModerador),
  tiempo: formatearFechaMomento(momento.fechaCreacion),
})

export default function Perfil() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const [perfil, setPerfil] = useState(null)
  const [momentos, setMomentos] = useState([])
  const [totalMomentos, setTotalMomentos] = useState(0)
  const [cursor, setCursor] = useState(null)
  const [tieneMas, setTieneMas] = useState(false)
  const [cargandoMomentos, setCargandoMomentos] = useState(true)
  const [cargandoMas, setCargandoMas] = useState(false)
  const [indicesImagen, setIndicesImagen] = useState({})
  const [ocultarIndicadoresPerfil, setOcultarIndicadoresPerfil] = useState(false)
  const [modalFotoAbierto, setModalFotoAbierto] = useState(false)
  const [archivoFoto, setArchivoFoto] = useState(null)
  const [previewFoto, setPreviewFoto] = useState('')
  const [zoomFoto, setZoomFoto] = useState(1)
  const [offsetFoto, setOffsetFoto] = useState({ x: 0, y: 0 })
  const [guardandoFoto, setGuardandoFoto] = useState(false)
  const [errorFoto, setErrorFoto] = useState('')
  const [popExito, setPopExito] = useState('')
  const [modalCompartirPerfil, setModalCompartirPerfil] = useState(false)
  const cargandoRef = useRef(false)
  const inputFotoRef = useRef(null)
  const imagenFotoRef = useRef(null)
  const dragFotoRef = useRef(null)
  const punterosFotoRef = useRef(new Map())
  const pellizcoFotoRef = useRef(null)
  const sentinelRef = useRef(null)
  const nombre = usuario?.nombreUsuario || usuario?.usuario || 'Raul'
  const usuarioPerfil = `@${String(perfil?.nombreUsuario || nombre).toLowerCase()}`
  const fotoPerfilUrl = normalizarMediaUrl(perfil?.fotoPerfilUrl)

  const cargarMomentos = useCallback(async (cursorActual = null, reemplazar = false) => {
    if (cargandoRef.current) return

    cargandoRef.current = true
    if (reemplazar) setCargandoMomentos(true)
    else setCargandoMas(true)

    const resultado = await momentoService.misMomentos({ cursor: cursorActual, cantidad: 30 })

    if (resultado.exito) {
      const datos = resultado.datos
      const nuevos = (datos?.items ?? []).map(mapearMomento)
      setMomentos((actuales) => reemplazar ? nuevos : [...actuales, ...nuevos])
      setCursor(datos?.siguienteCursor ?? null)
      setTieneMas(Boolean(datos?.tieneMas))
      setTotalMomentos(datos?.total ?? 0)
    }

    setCargandoMomentos(false)
    setCargandoMas(false)
    cargandoRef.current = false
  }, [])

  useEffect(() => {
    let activo = true
    authService.miPerfil().then((resultado) => {
      if (activo && resultado.exito) setPerfil(resultado.datos)
    })
    return () => { activo = false }
  }, [])

  useEffect(() => {
    cargarMomentos(null, true)
  }, [cargarMomentos])

  useEffect(() => {
    const nodo = sentinelRef.current
    if (!nodo || !tieneMas) return undefined

    const observer = new IntersectionObserver((entradas) => {
      if (entradas[0].isIntersecting && !cargandoRef.current) {
        cargarMomentos(cursor, false)
      }
    }, { rootMargin: '260px 0px' })

    observer.observe(nodo)
    return () => observer.disconnect()
  }, [cargarMomentos, cursor, tieneMas])

  const alternarLike = async (idMomento) => {
    const respuesta = await momentoService.alternarMeGusta(idMomento)
    if (!respuesta.exito || !respuesta.datos) return

    setMomentos((actuales) => actuales.map((momento) => (
      momento.id === idMomento
        ? { ...momento, likes: respuesta.datos.totalMeGusta, leGusta: respuesta.datos.leGusta }
        : momento
    )))

    setPerfil((actual) => {
      if (!actual) return actual
      const momento = momentos.find((item) => item.id === idMomento)
      const cambio = respuesta.datos.leGusta && !momento?.leGusta ? 1 : !respuesta.datos.leGusta && momento?.leGusta ? -1 : 0
      return {
        ...actual,
        totalMeEncanta: Math.max(0, (actual.totalMeEncanta ?? 0) + cambio),
      }
    })
  }

  const abrirSelectorFoto = () => inputFotoRef.current?.click()

  const seleccionarFoto = (e) => {
    const archivo = e.target.files?.[0]
    if (!archivo) return

    if (!archivo.type.startsWith('image/')) {
      setErrorFoto('Selecciona una imagen válida.')
      return
    }

    if (previewFoto) URL.revokeObjectURL(previewFoto)

    setArchivoFoto(archivo)
    setPreviewFoto(URL.createObjectURL(archivo))
    setZoomFoto(1)
    setOffsetFoto({ x: 0, y: 0 })
    setErrorFoto('')
    setModalFotoAbierto(true)
  }

  const cerrarModalFoto = () => {
    setModalFotoAbierto(false)
    setArchivoFoto(null)
    punterosFotoRef.current.clear()
    pellizcoFotoRef.current = null
    dragFotoRef.current = null
    if (previewFoto) URL.revokeObjectURL(previewFoto)
    setPreviewFoto('')
    setZoomFoto(1)
    setOffsetFoto({ x: 0, y: 0 })
    setErrorFoto('')
    if (inputFotoRef.current) inputFotoRef.current.value = ''
  }

  const iniciarArrastreFoto = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    punterosFotoRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (punterosFotoRef.current.size >= 2) {
      const [primero, segundo] = [...punterosFotoRef.current.values()]
      pellizcoFotoRef.current = {
        distanciaInicial: Math.hypot(segundo.x - primero.x, segundo.y - primero.y),
        zoomInicial: zoomFoto,
      }
      dragFotoRef.current = null
      return
    }

    dragFotoRef.current = {
      pointerId: e.pointerId,
      inicioX: e.clientX,
      inicioY: e.clientY,
      offsetInicial: offsetFoto,
    }
  }

  const arrastrarFoto = (e) => {
    if (punterosFotoRef.current.has(e.pointerId)) {
      punterosFotoRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    }

    if (punterosFotoRef.current.size >= 2 && pellizcoFotoRef.current) {
      const [primero, segundo] = [...punterosFotoRef.current.values()]
      const distanciaActual = Math.hypot(segundo.x - primero.x, segundo.y - primero.y)
      const { distanciaInicial, zoomInicial } = pellizcoFotoRef.current
      const factor = distanciaInicial ? distanciaActual / distanciaInicial : 1
      const zoom = Math.min(3, Math.max(1, Number((zoomInicial * factor).toFixed(2))))
      setZoomFoto(zoom)
      return
    }

    const drag = dragFotoRef.current
    if (!drag || drag.pointerId !== e.pointerId) return

    setOffsetFoto({
      x: drag.offsetInicial.x + (e.clientX - drag.inicioX),
      y: drag.offsetInicial.y + (e.clientY - drag.inicioY),
    })
  }

  const terminarArrastreFoto = (e) => {
    punterosFotoRef.current.delete(e.pointerId)
    if (punterosFotoRef.current.size < 2) pellizcoFotoRef.current = null
    if (dragFotoRef.current?.pointerId === e.pointerId) dragFotoRef.current = null
  }

  const ajustarZoomFoto = (e) => {
    e.preventDefault()
    const cambio = e.deltaY > 0 ? -0.08 : 0.08
    setZoomFoto((actual) => Math.min(3, Math.max(1, Number((actual + cambio).toFixed(2)))))
  }

  const centrarFoto = () => {
    setOffsetFoto({ x: 0, y: 0 })
    setZoomFoto(1)
  }

  const crearFotoRecortada = () => new Promise((resolve, reject) => {
    const imagen = imagenFotoRef.current
    if (!imagen) {
      reject(new Error('No se pudo preparar la imagen.'))
      return
    }

    const size = 512
    const editorSize = 240
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      reject(new Error('No se pudo preparar la imagen.'))
      return
    }

    const escalaBase = Math.max(size / imagen.naturalWidth, size / imagen.naturalHeight)
    const escala = escalaBase * zoomFoto
    const ancho = imagen.naturalWidth * escala
    const alto = imagen.naturalHeight * escala
    const offsetX = offsetFoto.x * (size / editorSize)
    const offsetY = offsetFoto.y * (size / editorSize)
    const x = (size - ancho) / 2 + offsetX
    const y = (size - alto) / 2 + offsetY

    ctx.fillStyle = '#f8fafc'
    ctx.fillRect(0, 0, size, size)
    ctx.drawImage(imagen, x, y, ancho, alto)

    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('No se pudo preparar la imagen.'))
        return
      }

      resolve(new File([blob], 'foto-perfil.webp', { type: 'image/webp' }))
    }, 'image/webp', 0.9)
  })

  const guardarFotoPerfil = async () => {
    if (!archivoFoto) {
      setErrorFoto('Selecciona una foto para tu perfil.')
      return
    }

    setGuardandoFoto(true)
    setErrorFoto('')

    let fotoFinal = archivoFoto
    try {
      fotoFinal = await crearFotoRecortada()
    } catch {
      setErrorFoto('No se pudo preparar la foto. Intenta con otra imagen.')
      setGuardandoFoto(false)
      return
    }

    const resultado = await authService.actualizarFotoPerfil(fotoFinal)
    setGuardandoFoto(false)

    if (!resultado.exito) {
      setErrorFoto(resultado.mensaje || 'Ups, algo salió mal. Inténtalo más tarde')
      return
    }

    setPerfil(resultado.datos)
    window.dispatchEvent(new Event('perfil-actualizado'))
    setPopExito('Foto de perfil actualizada')
    window.setTimeout(() => setPopExito(''), 1900)
    cerrarModalFoto()
  }

  return (
    <main className="app-shell">
      <AppSidebar activo="Perfil" />

      <section className="profile-page" aria-label="Mi perfil">
        <header className="profile-hero">
          <div className="profile-main">
            <button className="profile-photo editable" onClick={abrirSelectorFoto} aria-label="Cambiar foto de perfil">
              {fotoPerfilUrl
                ? <img src={fotoPerfilUrl} alt="Foto de perfil" />
                : <span><IconoPersona /></span>}
              <i>＋</i>
            </button>
            <input ref={inputFotoRef} type="file" accept="image/*,.heic,.heif" onChange={seleccionarFoto} hidden />
            <div className="profile-info">
              <p className="feed-kicker">Mi perfil</p>
              <div className="profile-title-row">
                <div className="profile-name-line">
                  <h1>{perfil?.nombrePerfil || nombre}</h1>
                  <Link className="settings-btn" to="/configuracion" aria-label="Configuracion del perfil">⚙</Link>
                </div>
                <span className="profile-handle">{usuarioPerfil}<UserTrustBadge verified={perfil?.esVerificado} moderator={perfil?.esModerador} /></span>
              </div>

              <div className="profile-stats" aria-label="Estadisticas del perfil">
                <Link to={`/perfil/${perfil?.idUsuario ?? usuario?.idUsuario}/seguidores`}>
                  <strong>{(perfil?.seguidores ?? 0).toLocaleString('es-MX')}</strong>
                  <span>Seguidores</span>
                </Link>
                <Link to={`/perfil/${perfil?.idUsuario ?? usuario?.idUsuario}/seguidos`}>
                  <strong>{(perfil?.seguidos ?? 0).toLocaleString('es-MX')}</strong>
                  <span>Seguidos</span>
                </Link>
                <div>
                  <strong>{(perfil?.totalMeEncanta ?? 0).toLocaleString('es-MX')}</strong>
                  <span>Me encanta</span>
                </div>
              </div>
              <p className="profile-about">{perfil?.sobreMi || 'Sin descripción todavía.'}</p>
              <div className="profile-actions">
                <Link className="profile-btn primary" to="/perfil/editar">Editar perfil</Link>
                <button className="profile-btn" onClick={() => setModalCompartirPerfil(true)}>Compartir perfil</button>
              </div>
            </div>
          </div>
        </header>

        <div className="profile-section-title">
          <h2>Momentos compartidos</h2>
          <span>{totalMomentos.toLocaleString('es-MX')} publicaciones</span>
        </div>

        {cargandoMomentos && (
          <div className="profile-moments">
            {Array.from({ length: 6 }).map((_, index) => (
              <article className="moment-card moment-card-skeleton" key={index}>
                <div className="skeleton-moment" />
                <div>
                  <div className="skeleton line wide" />
                  <div className="skeleton line small" />
                </div>
              </article>
            ))}
          </div>
        )}

        {!cargandoMomentos && momentos.length === 0 && (
          <section className="profile-empty-moments">
            <h3>Aún no has compartido momentos</h3>
            <p>Cuando publiques algo, aparecerá aquí ligado a tu perfil.</p>
          </section>
        )}

        {!cargandoMomentos && momentos.length > 0 && (
          <div className="profile-moments">
            {momentos.map((momento) => (
              <article className="moment-card" key={momento.id}>
                {momento.imagenes?.length ? (
                  <div className="profile-moment-carousel">
                    <img
                      src={momento.imagenes[indicesImagen[momento.id] || 0]}
                      alt="Momento compartido por el usuario"
                      onPointerDown={() => setOcultarIndicadoresPerfil(true)}
                      onPointerUp={() => setOcultarIndicadoresPerfil(false)}
                      onPointerLeave={() => setOcultarIndicadoresPerfil(false)}
                    />
                    {momento.imagenes.length > 1 && <>
                      <div className="carousel-zone carousel-zone-prev" onClick={() => setIndicesImagen((a) => ({ ...a, [momento.id]: ((a[momento.id] || 0) - 1 + momento.imagenes.length) % momento.imagenes.length }))} />
                      <div className="carousel-zone carousel-zone-next" onClick={() => setIndicesImagen((a) => ({ ...a, [momento.id]: ((a[momento.id] || 0) + 1) % momento.imagenes.length }))} />
                      {!ocultarIndicadoresPerfil && <div className="carousel-dots">
                        {momento.imagenes.map((_, indice) => <span key={indice} className={indice === (indicesImagen[momento.id] || 0) ? 'activo' : ''} />)}
                      </div>}
                    </>}
                  </div>
                ) : (
                  <div className="moment-text-preview">{momento.texto}</div>
                )}
                <div className="post-actions">
                  <div>
                    <button
                      className={momento.leGusta ? 'liked' : ''}
                      onClick={() => alternarLike(momento.id)}
                      aria-label={momento.leGusta ? 'Quitar me encanta' : 'Me encanta'}
                    >
                      {momento.leGusta ? '♥' : '♡'}
                    </button>
                    <button aria-label="Ver comentarios" onClick={() => navigate(`/inicio?momento=${momento.id}`)}>
                      <svg className="comment-action-icon" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M8 4h8a4 4 0 0 1 4 4v4a4 4 0 0 1-4 4h-4l-4 4v-4a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4Z" />
                      </svg>
                    </button>
                  </div>
                  <button className="share-action" aria-label="Compartir momento" title="Compartir momento">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 6v3.4h-2.8c-4.8 0-7.6 2.9-8.2 8.1 1.6-2.4 4.1-3.6 7.3-3.6H14V18l7-6-7-6Z" /></svg>
                  </button>
                </div>

                <div className="post-body">
                  <strong>{momento.likes.toLocaleString('es-MX')} me gusta</strong>
                  <p>{momento.texto}</p>
                  {momento.linkUrl && <a className="post-link" href={momento.linkUrl} target="_blank" rel="noreferrer">Abrir enlace</a>}
                  <button className="comments-btn" onClick={() => navigate(`/inicio?momento=${momento.id}`)}>
                    Ver {momento.comentarios.toLocaleString('es-MX')} comentarios
                  </button>
                </div>
              </article>
            ))}

            {cargandoMas && Array.from({ length: 2 }).map((_, index) => (
              <article className="moment-card moment-card-skeleton" key={`mas-${index}`}>
                <div className="skeleton-moment" />
                <div>
                  <div className="skeleton line wide" />
                  <div className="skeleton line small" />
                </div>
              </article>
            ))}
          </div>
        )}

        <div ref={sentinelRef} className="profile-load-sentinel" aria-hidden="true" />
      </section>

      {modalFotoAbierto && (
        <div className="profile-photo-backdrop" role="presentation" onClick={cerrarModalFoto}>
          <section className="profile-photo-modal" role="dialog" aria-modal="true" aria-label="Ajustar foto de perfil" onClick={(e) => e.stopPropagation()}>
            <header>
              <div>
                <p className="feed-kicker">Foto de perfil</p>
                <h2>Ajustar foto</h2>
              </div>
              <button onClick={cerrarModalFoto} aria-label="Cerrar">×</button>
            </header>

            <div
              className="profile-photo-editor"
              onPointerDown={iniciarArrastreFoto}
              onPointerMove={arrastrarFoto}
              onPointerUp={terminarArrastreFoto}
              onPointerCancel={terminarArrastreFoto}
              onWheel={ajustarZoomFoto}
              onDoubleClick={centrarFoto}
              role="presentation"
            >
              {previewFoto && (
                <img
                  ref={imagenFotoRef}
                  src={previewFoto}
                  alt="Vista previa de foto de perfil"
                  draggable="false"
                  style={{
                    transform: `translate(${offsetFoto.x}px, ${offsetFoto.y}px) scale(${zoomFoto})`,
                  }}
                />
              )}
            </div>

            <p className="profile-photo-hint">Arrastra para acomodar. Pellizca o usa la rueda para acercar. Doble click centra la foto.</p>

            {errorFoto && <p className="profile-form-error">{errorFoto}</p>}

            <div className="profile-photo-actions">
              <button className="profile-btn" onClick={cerrarModalFoto}>Cancelar</button>
              <button className="profile-btn primary" onClick={guardarFotoPerfil} disabled={guardandoFoto}>
                {guardandoFoto ? <span className="spinner" aria-hidden="true" /> : 'Guardar foto'}
              </button>
            </div>
          </section>
        </div>
      )}

      {modalCompartirPerfil && (
        <div className="profile-share-backdrop" role="presentation" onClick={() => setModalCompartirPerfil(false)}>
          <section className="profile-share-modal" role="dialog" aria-modal="true" aria-label="Compartir perfil" onClick={(e) => e.stopPropagation()}>
            <button className="profile-share-close" type="button" aria-label="Cerrar" onClick={() => setModalCompartirPerfil(false)}>×</button>
            <p className="feed-kicker">Comparte este perfil</p>
            <h2>{usuarioPerfil}</h2>
            <div className="profile-share-qr">
              <QRCodeSVG value={`${window.location.origin}/perfil/${String(perfil?.nombreUsuario || nombre).toLowerCase()}`} size={210} level="M" includeMargin />
            </div>
            <p>Escanea el código QR para visitar el perfil de {usuarioPerfil}.</p>
          </section>
        </div>
      )}

      <SuccessPop visible={Boolean(popExito)} mensaje={popExito} />

      <MessagesWidget />
    </main>
  )
}
