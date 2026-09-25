import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import MessagesWidget from '../components/MessagesWidget'
import { useAuth } from '../context/AuthContext'

const ajustes = [
  { titulo: 'Cuenta', descripcion: 'Datos personales, nombre de usuario y correo.' },
  { titulo: 'Privacidad', descripcion: 'Controla quien puede ver tus momentos y enviarte mensajes.' },
  { titulo: 'Notificaciones', descripcion: 'Administra avisos de me encanta, comentarios y mensajes.' },
  { titulo: 'Seguridad', descripcion: 'Contrasena, sesiones activas y proteccion de la cuenta.' },
]

export default function Configuracion() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [confirmarSalida, setConfirmarSalida] = useState(false)

  const cerrarSesion = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <main className="app-shell">
      <AppSidebar />

      <section className="settings-page" aria-label="Configuracion">
        <header className="settings-header">
          <p className="feed-kicker">Mi cuenta</p>
          <h1>Configuracion</h1>
          <span>Administra como se ve, se protege y se comporta tu experiencia en MyMoment.</span>
        </header>

        <div className="settings-list">
          {ajustes.map((ajuste) => (
            <button className="settings-row" key={ajuste.titulo}>
              <span>
                <strong>{ajuste.titulo}</strong>
                <small>{ajuste.descripcion}</small>
              </span>
              <i>›</i>
            </button>
          ))}
        </div>

        <section className="logout-section">
          <div>
            <strong>Cerrar sesion</strong>
            <p>Sal de tu cuenta en este dispositivo.</p>
          </div>
          <button className="danger-btn" onClick={() => setConfirmarSalida(true)}>Cerrar sesion</button>
        </section>
      </section>

      {confirmarSalida && (
        <div className="modal-backdrop" role="presentation">
          <section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="cerrar-sesion-titulo">
            <h2 id="cerrar-sesion-titulo">Cerrar sesion</h2>
            <p>¿Seguro que quieres cerrar sesion en MyMoment?</p>
            <div>
              <button className="profile-btn" onClick={() => setConfirmarSalida(false)}>Cancelar</button>
              <button className="danger-btn" onClick={cerrarSesion}>Si, cerrar sesion</button>
            </div>
          </section>
        </div>
      )}

      <MessagesWidget />
    </main>
  )
}
