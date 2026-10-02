import { useCallback, useEffect, useRef, useState } from 'react'
import AppSidebar from '../components/AppSidebar'
import MessagesWidget from '../components/MessagesWidget'
import SuccessPop from '../components/SuccessPop'
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

const mapearMomento = (momento) => ({
  id: momento.idMomento,
  texto: momento.texto,
  imagen: normalizarMediaUrl(momento.archivoUrl),
  tipoAdjunto: momento.tipoAdjunto,
  linkUrl: momento.linkUrl,
  likes: momento.totalMeGusta ?? 0,
  comentarios: momento.totalComentarios ?? 0,
  leGusta: Boolean(momento.leGusta),
  tiempo: formatearFechaMomento(momento.fechaCreacion),
})

export default function Perfil() {
  const { usuario } = useAuth()
  const [perfil, setPerfil] = useState(null)
  const [momentos, setMomentos] = useState([])
  const [totalMomentos, setTotalMomentos] = useState(0)
  const [cursor, setCursor] = useState(null)
  const [tieneMas, setTieneMas] = useState(false)
  const [cargandoMomentos, setCargandoMomentos] = useState(true)
  const [cargandoMas, setCargandoMas] = useState(false)
  const [modalFotoAbierto, setModalFotoAbierto] = useState(false)
  const [archivoFoto, setArchivoFoto] = useState(null)
  const [previewFoto, setPreviewFoto] = useState('')
  const [zoomFoto, setZoomFoto] = useState(1)
  const [offsetFoto, setOffsetFoto] = useState({ x: 0, y: 0 })
  const [guardandoFoto, setGuardandoFoto] = useState(false)
  const [errorFoto, setErrorFoto] = useState('')
  const [popExito, setPopExito] = useState('')
  const cargandoRef = useRef(false)
  const inputFotoRef = useRef(null)
  const imagenFotoRef = useRef(null)
  const dragFotoRef = useRef(null)
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
    if (previewFoto) URL.revokeObjectURL(previewFoto)
    setPreviewFoto('')
    setZoomFoto(1)
    setOffsetFoto({ x: 0, y: 0 })
    setErrorFoto('')
    if (inputFotoRef.current) inputFotoRef.current.value = ''
  }

  const iniciarArrastreFoto = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragFotoRef.current = {
      pointerId: e.pointerId,
      inicioX: e.clientX,
      inicioY: e.clientY,
      offsetInicial: offsetFoto,
    }
  }

  const arrastrarFoto = (e) => {
    const drag = dragFotoRef.current
    if (!drag || drag.pointerId !== e.pointerId) return

    setOffsetFoto({
      x: drag.offsetInicial.x + (e.clientX - drag.inicioX),
      y: drag.offsetInicial.y + (e.clientY - drag.inicioY),
    })
  }

  const terminarArrastreFoto = (e) => {
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
                : <span>{nombre.slice(0, 2).toUpperCase()}</span>}
              <i>＋</i>
            </button>
            <input ref={inputFotoRef} type="file" accept="image/*" onChange={seleccionarFoto} hidden />
            <div className="profile-info">
              <p className="feed-kicker">Mi perfil</p>
              <div className="profile-title-row">
                <div className="profile-name-line">
                  <h1>{perfil?.nombrePerfil || nombre}</h1>
                  <Link className="settings-btn" to="/configuracion" aria-label="Configuracion del perfil">⚙</Link>
                </div>
                <span>{usuarioPerfil}</span>
              </div>

              <div className="profile-stats" aria-label="Estadisticas del perfil">
                <div>
                  <strong>{(perfil?.seguidores ?? 0).toLocaleString('es-MX')}</strong>
                  <span>Seguidores</span>
                </div>
                <div>
                  <strong>{(perfil?.seguidos ?? 0).toLocaleString('es-MX')}</strong>
                  <span>Seguidos</span>
                </div>
                <div>
                  <strong>{(perfil?.totalMeEncanta ?? 0).toLocaleString('es-MX')}</strong>
                  <span>Me encanta</span>
                </div>
              </div>
              <p className="profile-about">{perfil?.sobreMi || 'Sin descripción todavía.'}</p>
              <div className="profile-actions">
                <Link className="profile-btn primary" to="/perfil/editar">Editar perfil</Link>
                <button className="profile-btn">Compartir perfil</button>
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
                {momento.imagen ? (
                  momento.tipoAdjunto === 'video'
                    ? <video src={momento.imagen} controls />
                    : <img src={momento.imagen} alt="Momento compartido por el usuario" />
                ) : (
                  <div className="moment-text-preview">{momento.texto}</div>
                )}
                <div>
                  <p>{momento.texto}</p>
                  {momento.linkUrl && <a href={momento.linkUrl} target="_blank" rel="noreferrer">Abrir enlace</a>}
                  <div className="moment-card-meta">
                    <button
                      className={momento.leGusta ? 'liked' : ''}
                      onClick={() => alternarLike(momento.id)}
                      aria-label={momento.leGusta ? 'Quitar me encanta' : 'Me encanta'}
                    >
                      {momento.leGusta ? '♥' : '♡'}
                    </button>
                    <strong>{momento.likes.toLocaleString('es-MX')} me encanta · {momento.tiempo}</strong>
                  </div>
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

            <p className="profile-photo-hint">Arrastra para acomodar. Usa la rueda para acercar. Doble click centra la foto.</p>

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

      <SuccessPop visible={Boolean(popExito)} mensaje={popExito} />

      <MessagesWidget />
    </main>
  )
}
