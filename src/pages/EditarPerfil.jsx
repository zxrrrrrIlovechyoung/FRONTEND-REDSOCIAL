import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import MessagesWidget from '../components/MessagesWidget'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/authService'

export default function EditarPerfil() {
  const { usuario } = useAuth()
  const [perfil, setPerfil] = useState(null)
  const [sobreMi, setSobreMi] = useState('')
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const nombre = usuario?.nombreUsuario || usuario?.usuario || 'Raul'

  useEffect(() => {
    let activo = true

    const cargarPerfil = async () => {
      setCargando(true)
      const resultado = await authService.miPerfil()
      if (!activo) return

      if (resultado.exito) {
        setPerfil(resultado.datos)
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
    setMensaje('Perfil actualizado.')
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
            <div className="profile-photo">{(perfil?.nombreUsuario || nombre).slice(0, 2).toUpperCase()}</div>
            <div>
              <strong>{perfil?.nombrePerfil || nombre}</strong>
              <span>@{String(perfil?.nombreUsuario || nombre).toLowerCase()}</span>
            </div>
          </aside>

          <div className="edit-profile-form">
            <label htmlFor="sobre-mi">Sobre mí</label>
            {cargando ? (
              <div className="edit-profile-skeleton">
                <div className="skeleton line wide" />
                <div className="skeleton-moment" />
              </div>
            ) : (
              <>
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
                    {guardando ? <span className="spinner" aria-hidden="true" /> : 'Guardar cambios'}
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
