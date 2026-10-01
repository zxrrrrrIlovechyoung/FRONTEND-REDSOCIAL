import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import MessagesWidget from '../components/MessagesWidget'
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
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const inputFotoRef = useRef(null)
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
    setNombreUsuario(resultado.datos?.nombreUsuario ?? '')
    setMensaje('Usuario actualizado.')
  }

  const cambiarFoto = async (e) => {
    const foto = e.target.files?.[0]
    if (!foto) return

    setSubiendoFoto(true)
    setError('')
    setMensaje('')

    const resultado = await authService.actualizarFotoPerfil(foto)
    setSubiendoFoto(false)
    if (inputFotoRef.current) inputFotoRef.current.value = ''

    if (!resultado.exito) {
      setError(resultado.mensaje || 'Ups, algo salió mal. Inténtalo más tarde')
      return
    }

    setPerfil(resultado.datos)
    setMensaje('Foto de perfil actualizada.')
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

      <MessagesWidget />
    </main>
  )
}
