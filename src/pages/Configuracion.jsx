import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import { useAuth } from '../context/AuthContext'

const ajustes = [
  { titulo: 'Cuenta', descripcion: 'Datos personales, nombre de usuario y correo.' },
  { titulo: 'Privacidad', descripcion: 'Controla quien puede ver tus momentos y enviarte mensajes.' },
  { titulo: 'Notificaciones', descripcion: 'Administra avisos de me encanta, comentarios y mensajes.' },
  { titulo: 'Seguridad', descripcion: 'Contrasena, sesiones activas y proteccion de la cuenta.' },
]

const opcionesCuenta = [
  { id: 'password', titulo: 'Cambiar contraseña', descripcion: 'Actualiza la contraseña con la que entras a Moment.', tono: 'normal' },
  { id: 'desactivar', titulo: 'Desactivar cuenta', descripcion: 'Oculta temporalmente tu perfil y tus momentos.', tono: 'warning' },
  { id: 'eliminar', titulo: 'Eliminar cuenta', descripcion: 'Borra tu cuenta y la informacion asociada de forma permanente.', tono: 'danger' },
]

export default function Configuracion() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [confirmarSalida, setConfirmarSalida] = useState(false)
  const [cuentaAbierta, setCuentaAbierta] = useState(true)
  const [detalle, setDetalle] = useState('')

  const opcionActiva = opcionesCuenta.find((opcion) => opcion.id === detalle)

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
          <span>Administra como se ve, se protege y se comporta tu experiencia en Moment.</span>
        </header>

        <div className={`settings-layout${detalle ? ' con-detalle' : ''}`}>
          <div>
            <div className={`settings-master ${detalle ? 'detail-mode' : ''}`}>
              {!detalle ? (
                <div className="settings-list settings-main-list">
                  {ajustes.map((ajuste) => (
                    <div className="settings-item" key={ajuste.titulo}>
                      <button
                        className="settings-row"
                        onClick={ajuste.titulo === 'Cuenta' ? () => setCuentaAbierta((valor) => !valor) : undefined}
                      >
                        <span>
                          <strong>{ajuste.titulo}</strong>
                          <small>{ajuste.descripcion}</small>
                        </span>
                        <i>{ajuste.titulo === 'Cuenta' && cuentaAbierta ? '⌄' : '›'}</i>
                      </button>

                      {ajuste.titulo === 'Cuenta' && (
                        <div className={`account-options${cuentaAbierta ? ' abierto' : ''}`}>
                          <div className="account-options-inner">
                            {opcionesCuenta.map((opcion) => (
                              <button
                                className={`account-option ${opcion.tono}`}
                                key={opcion.id}
                                onClick={() => setDetalle(opcion.id)}
                              >
                                <span>
                                  <strong>{opcion.titulo}</strong>
                                  <small>{opcion.descripcion}</small>
                                </span>
                                <i>›</i>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="settings-subdetail-card">
                  <button className="back-row" onClick={() => setDetalle('')}>‹ Volver a configuracion</button>
                  <p className="feed-kicker">Cuenta</p>
                  <h3>{opcionActiva?.titulo}</h3>
                  <span>{opcionActiva?.descripcion}</span>
                </div>
              )}
            </div>

            {!detalle && (
              <section className="logout-section">
                <div>
                  <strong>Cerrar sesion</strong>
                  <p>Sal de tu cuenta en este dispositivo.</p>
                </div>
                <button className="danger-btn" onClick={() => setConfirmarSalida(true)}>Cerrar sesion</button>
              </section>
            )}
          </div>

          {detalle && (
          <section className="settings-detail" aria-label="Detalle de configuracion">
            {detalle === 'password' && (
              <>
                <p className="feed-kicker">Cuenta</p>
                <h2>Cambiar contraseña</h2>
                <p className="detail-copy">Actualiza tu contraseña. Por ahora esta vista es estatica para validar el flujo.</p>
                <div className="detail-form">
                  <input type="password" placeholder="Contraseña actual" />
                  <input type="password" placeholder="Nueva contraseña" />
                  <input type="password" placeholder="Confirmar nueva contraseña" />
                  <button>Guardar cambios</button>
                </div>
              </>
            )}

            {detalle === 'desactivar' && (
              <>
                <p className="feed-kicker">Cuenta</p>
                <h2>Desactivar cuenta</h2>
                <p className="detail-copy">Tu perfil quedaria oculto temporalmente y podrias volver cuando inicies sesion de nuevo.</p>
                <div className="detail-warning">
                  <strong>Antes de continuar</strong>
                  <span>Tus momentos no se borran, solo dejan de estar visibles.</span>
                </div>
                <button className="warning-btn">Desactivar cuenta</button>
              </>
            )}

            {detalle === 'eliminar' && (
              <>
                <p className="feed-kicker">Cuenta</p>
                <h2>Eliminar cuenta</h2>
                <p className="detail-copy">Esta accion eliminaria tu perfil, momentos, mensajes y preferencias de forma permanente.</p>
                <div className="detail-warning danger">
                  <strong>Accion permanente</strong>
                  <span>Mas adelante agregaremos una confirmacion fuerte antes de permitir esto.</span>
                </div>
                <button className="danger-btn">Eliminar cuenta</button>
              </>
            )}
          </section>
          )}
        </div>
      </section>

      {confirmarSalida && (
        <div className="modal-backdrop" role="presentation">
          <section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="cerrar-sesion-titulo">
            <h2 id="cerrar-sesion-titulo">Cerrar sesion</h2>
            <p>¿Seguro que quieres cerrar sesion en Moment?</p>
            <div>
              <button className="profile-btn" onClick={() => setConfirmarSalida(false)}>Cancelar</button>
              <button className="danger-btn" onClick={cerrarSesion}>Si, cerrar sesion</button>
            </div>
          </section>
        </div>
      )}

    </main>
  )
}
