import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import MessagesWidget from '../components/MessagesWidget'
import SuccessPop from '../components/SuccessPop'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/authService'

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:5079/api').replace(/\/api\/?$/, '')

const normalizarMediaUrl = (url) => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${apiBaseUrl}${url.startsWith('/') ? url : `/${url}`}`
}

const formatearFecha = (fecha) => {
  if (!fecha) return ''
  const texto = String(fecha)
  const valor = new Date(/(?:z|[+-]\d{2}:\d{2})$/i.test(texto) ? texto : `${texto}Z`)
  return Number.isNaN(valor.getTime())
    ? ''
    : valor.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export default function EditarPerfil() {
  const { usuario } = useAuth()
  const [perfil, setPerfil] = useState(null)
  const [nombrePerfil, setNombrePerfil] = useState('')
  const [nombreUsuario, setNombreUsuario] = useState('')
  const [sobreMi, setSobreMi] = useState('')
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [guardandoNombre, setGuardandoNombre] = useState(false)
  const [guardandoUsuario, setGuardandoUsuario] = useState(false)
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [modalFotoAbierto, setModalFotoAbierto] = useState(false)
  const [archivoFoto, setArchivoFoto] = useState(null)
  const [previewFoto, setPreviewFoto] = useState('')
  const [zoomFoto, setZoomFoto] = useState(1)
  const [offsetFoto, setOffsetFoto] = useState({ x: 0, y: 0 })
  const [errorFoto, setErrorFoto] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [popExito, setPopExito] = useState('')
  const [error, setError] = useState('')
  const inputFotoRef = useRef(null)
  const imagenFotoRef = useRef(null)
  const dragFotoRef = useRef(null)
  const nombre = usuario?.nombreUsuario || usuario?.usuario || 'Raul'
  const fotoPerfilUrl = normalizarMediaUrl(perfil?.fotoPerfilUrl)

  useEffect(() => {
    let activo = true

    const cargarPerfil = async () => {
      setCargando(true)
      const resultado = await authService.miPerfil()
      if (!activo) return

      if (resultado.exito) {
        setPerfil(resultado.datos)
        setNombrePerfil(resultado.datos?.nombrePerfil ?? '')
        setNombreUsuario(resultado.datos?.nombreUsuario ?? '')
        setSobreMi(resultado.datos?.sobreMi ?? '')
      }

      setCargando(false)
    }

    cargarPerfil()
    return () => {
      activo = false
    }
  }, [])

  const guardar = async () => {
    if (sobreMi.length > 300) {
      setError('El sobre mí no puede superar los 300 caracteres.')
      return
    }

    setGuardando(true)
    setError('')
    setMensaje('')

    const resultado = await authService.actualizarSobreMi(sobreMi)
    setGuardando(false)

    if (!resultado.exito) {
      setError(resultado.mensaje || 'Ups, algo salió mal. Inténtalo más tarde')
      return
    }

    setPerfil(resultado.datos)
    setSobreMi(resultado.datos?.sobreMi ?? '')
    setMensaje('Sobre mí actualizado.')
  }

  const guardarNombrePerfil = async () => {
    setGuardandoNombre(true)
    setError('')
    setMensaje('')

    const resultado = await authService.actualizarNombrePerfil(nombrePerfil)
    setGuardandoNombre(false)

    if (!resultado.exito) {
      setError(resultado.mensaje || 'Ups, algo salió mal. Inténtalo más tarde')
      return
    }

    setPerfil(resultado.datos)
    window.dispatchEvent(new Event('perfil-actualizado'))
    setNombrePerfil(resultado.datos?.nombrePerfil ?? '')
    setMensaje('Nombre de perfil actualizado.')
  }

  const guardarNombreUsuario = async () => {
    setGuardandoUsuario(true)
    setError('')
    setMensaje('')

    const usuarioLimpio = nombreUsuario.trim().replace(/^@+/, '')
    const resultado = await authService.actualizarNombreUsuario(usuarioLimpio)
    setGuardandoUsuario(false)

    if (!resultado.exito) {
      setError(resultado.mensaje || 'Ups, algo salió mal. Inténtalo más tarde')
      return
    }

    setPerfil(resultado.datos)
    window.dispatchEvent(new Event('perfil-actualizado'))
    setNombreUsuario(resultado.datos?.nombreUsuario ?? '')
    setMensaje('Usuario actualizado.')
  }

  const cambiarFoto = (e) => {
    const foto = e.target.files?.[0]
    if (!foto) return

    if (!foto.type.startsWith('image/')) {
      setError('Selecciona una imagen válida.')
      return
    }

    if (previewFoto) URL.revokeObjectURL(previewFoto)

    setArchivoFoto(foto)
    setPreviewFoto(URL.createObjectURL(foto))
    setZoomFoto(1)
    setOffsetFoto({ x: 0, y: 0 })
    setErrorFoto('')
    setModalFotoAbierto(true)
    setError('')
    setMensaje('')
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

    let fotoFinal
    try {
      fotoFinal = await crearFotoRecortada()
    } catch {
      setErrorFoto('No se pudo preparar la foto. Intenta con otra imagen.')
      return
    }

    setSubiendoFoto(true)
    setErrorFoto('')

    const resultado = await authService.actualizarFotoPerfil(fotoFinal)
    setSubiendoFoto(false)

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

      <section className="edit-profile-page" aria-label="Editar perfil">
        <header className="edit-profile-head">
          <div>
            <p className="feed-kicker">Personalización</p>
            <h1>Editar perfil</h1>
          </div>
          <Link className="profile-btn" to="/perfil">Volver</Link>
        </header>

        <section className="edit-profile-panel">
          <aside className="edit-profile-preview">
            <button className="profile-photo editable" onClick={() => inputFotoRef.current?.click()} aria-label="Cambiar foto de perfil">
              {fotoPerfilUrl
                ? <img src={fotoPerfilUrl} alt="Foto de perfil" />
                : <span>{(perfil?.nombreUsuario || nombre).slice(0, 2).toUpperCase()}</span>}
              <i>{subiendoFoto ? '...' : '＋'}</i>
            </button>
            <input ref={inputFotoRef} type="file" accept="image/*" onChange={cambiarFoto} hidden />
            <div>
              <strong>{perfil?.nombrePerfil || nombre}</strong>
              <span>@{String(perfil?.nombreUsuario || nombre).toLowerCase()}</span>
            </div>
          </aside>

          <div className="edit-profile-form">
            {cargando ? (
              <div className="edit-profile-skeleton">
                <div className="skeleton line wide" />
                <div className="skeleton-moment" />
              </div>
            ) : (
              <>
                <div className="profile-edit-grid">
                  <div className="profile-edit-field">
                    <label htmlFor="nombre-perfil">Nombre de perfil</label>
                    <input
                      id="nombre-perfil"
                      value={nombrePerfil}
                      onChange={(e) => {
                        setNombrePerfil(e.target.value.slice(0, 60))
                        setMensaje('')
                        setError('')
                      }}
                      placeholder="Tu nombre visible"
                    />
                    <small>
                      Puede cambiarse cada 3 días.
                      {perfil?.proximoCambioNombrePerfil ? ` Próximo: ${formatearFecha(perfil.proximoCambioNombrePerfil)}.` : ''}
                    </small>
                    <button className="profile-btn" onClick={guardarNombrePerfil} disabled={guardandoNombre}>
                      {guardandoNombre ? <span className="spinner oscuro" aria-hidden="true" /> : 'Guardar nombre'}
                    </button>
                  </div>

                  <div className="profile-edit-field">
                    <label htmlFor="nombre-usuario">@Usuario</label>
                    <input
                      id="nombre-usuario"
                      value={`@${nombreUsuario}`}
                      onChange={(e) => {
                        setNombreUsuario(e.target.value.replace(/^@+/, '').slice(0, 30).toLowerCase())
                        setMensaje('')
                        setError('')
                      }}
                      placeholder="@tu_usuario"
                    />
                    <small>
                      Debe incluir _ y puede cambiarse cada 3 semanas.
                      {perfil?.proximoCambioNombreUsuario ? ` Próximo: ${formatearFecha(perfil.proximoCambioNombreUsuario)}.` : ''}
                    </small>
                    <button className="profile-btn" onClick={guardarNombreUsuario} disabled={guardandoUsuario}>
                      {guardandoUsuario ? <span className="spinner oscuro" aria-hidden="true" /> : 'Guardar usuario'}
                    </button>
                  </div>
                </div>

                <label htmlFor="sobre-mi">Sobre mí</label>
                <div className="edit-profile-textarea">
                  <textarea
                    id="sobre-mi"
                    value={sobreMi}
                    onChange={(e) => {
                      setSobreMi(e.target.value.slice(0, 300))
                      setMensaje('')
                      setError('')
                    }}
                    placeholder="Cuéntale a los demás un poco sobre ti..."
                    maxLength={300}
                  />
                  <small>{sobreMi.length}/300</small>
                </div>

                {error && <p className="profile-form-error">{error}</p>}
                {mensaje && <p className="profile-form-success">{mensaje}</p>}

                <div className="edit-profile-actions">
                  <button className="profile-btn primary" onClick={guardar} disabled={guardando}>
                    {guardando ? <span className="spinner" aria-hidden="true" /> : 'Guardar sobre mí'}
                  </button>
                </div>
              </>
            )}
          </div>
        </section>
      </section>

      <SuccessPop visible={Boolean(popExito)} mensaje={popExito} />

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
                  style={{ transform: `translate(${offsetFoto.x}px, ${offsetFoto.y}px) scale(${zoomFoto})` }}
                />
              )}
            </div>

            <p className="profile-photo-hint">Arrastra para acomodar. Usa la rueda para acercar. Doble click centra la foto.</p>

            {errorFoto && <p className="profile-form-error">{errorFoto}</p>}

            <div className="profile-photo-actions">
              <button className="profile-btn" onClick={cerrarModalFoto}>Cancelar</button>
              <button className="profile-btn primary" onClick={guardarFotoPerfil} disabled={subiendoFoto}>
                {subiendoFoto ? <span className="spinner" aria-hidden="true" /> : 'Guardar foto'}
              </button>
            </div>
          </section>
        </div>
      )}

      <MessagesWidget />
    </main>
  )
}
