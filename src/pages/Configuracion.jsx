import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import CampoPassword from '../components/CampoPassword'
import SuccessPop from '../components/SuccessPop'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/authService'

const reglasPassword = [
  { id: 'longitud', texto: 'Mínimo 8 caracteres', valida: (valor) => valor.length >= 8 },
  { id: 'mayuscula', texto: 'Al menos una mayúscula', valida: (valor) => /[A-ZÁÉÍÓÚÑ]/.test(valor) },
  { id: 'especial', texto: 'Al menos un carácter especial', valida: (valor) => /[^A-Za-z0-9ÁÉÍÓÚáéíóúÑñ]/.test(valor) },
]

const reglasFuerzaPassword = [
  (valor) => valor.length >= 8,
  (valor) => /[a-záéíóúñ]/.test(valor),
  (valor) => /[A-ZÁÉÍÓÚÑ]/.test(valor),
  (valor) => /\d/.test(valor),
  (valor) => /[^A-Za-z0-9ÁÉÍÓÚáéíóúÑñ]/.test(valor),
]

const ajustes = [
  { titulo: 'Cuenta', descripcion: 'Datos personales, nombre de usuario y correo.' },
  { titulo: 'Privacidad', descripcion: 'Controla quien puede ver tus momentos y enviarte mensajes.' },
  { titulo: 'Notificaciones', descripcion: 'Administra avisos de me encanta, comentarios y mensajes.' },
]

const opcionesCuenta = [
  { id: 'password', titulo: 'Cambiar contraseña', descripcion: 'Actualiza la contraseña con la que entras a Moment.', tono: 'normal' },
  { id: 'sesiones', titulo: 'Mis inicios de sesión', descripcion: 'Revisa los dispositivos y accesos recientes de tu cuenta.', tono: 'normal' },
  { id: 'email', titulo: 'Correo electrónico', descripcion: 'Consulta o cambia el correo ligado a tu cuenta.', tono: 'normal' },
  { id: 'actividad', titulo: 'Actividad de la cuenta', descripcion: 'Historial de cambios importantes y movimientos de seguridad.', tono: 'normal' },
]

const accionesCuenta = [
  { id: 'desactivar', titulo: 'Desactivar cuenta', descripcion: 'Oculta temporalmente tu perfil y tus momentos.', tono: 'warning' },
  { id: 'eliminar', titulo: 'Eliminar cuenta', descripcion: 'Borra tu cuenta y la informacion asociada de forma permanente.', tono: 'danger' },
]

const todasOpcionesCuenta = [...opcionesCuenta, ...accionesCuenta]
const esperarCargaBreve = () => new Promise((resolve) => window.setTimeout(resolve, 500 + Math.random() * 500))

export default function Configuracion() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [confirmarSalida, setConfirmarSalida] = useState(false)
  const [seccion, setSeccion] = useState('')
  const [detalle, setDetalle] = useState('')
  const [passwordForm, setPasswordForm] = useState({ actual: '', nueva: '', confirmar: '' })
  const [erroresPassword, setErroresPassword] = useState({})
  const [guardandoPassword, setGuardandoPassword] = useState(false)
  const [checksDesactivar, setChecksDesactivar] = useState({ revision: false, oculto: false, regreso: false })
  const [confirmarDesactivar, setConfirmarDesactivar] = useState(false)
  const [desactivandoCuenta, setDesactivandoCuenta] = useState(false)
  const [errorDesactivar, setErrorDesactivar] = useState('')
  const [passwordDesactivar, setPasswordDesactivar] = useState('')
  const [errorPasswordDesactivar, setErrorPasswordDesactivar] = useState('')
  const [passwordDesactivarValida, setPasswordDesactivarValida] = useState(false)
  const [passwordEliminar, setPasswordEliminar] = useState('')
  const [errorEliminar, setErrorEliminar] = useState('')
  const [verificandoEliminar, setVerificandoEliminar] = useState(false)
  const [passwordEliminacionValida, setPasswordEliminacionValida] = useState(false)
  const [checksEliminar, setChecksEliminar] = useState({ periodo: false, cancelar: false, permanente: false })
  const [confirmarEliminar, setConfirmarEliminar] = useState(false)
  const [eliminandoCuenta, setEliminandoCuenta] = useState(false)
  const [popExito, setPopExito] = useState('')

  const passwordCumple = reglasPassword.every((regla) => regla.valida(passwordForm.nueva))
  const noCoinciden = passwordForm.confirmar !== '' && passwordForm.nueva !== passwordForm.confirmar
  const passwordLista = passwordForm.actual !== '' && passwordCumple && passwordForm.confirmar !== '' && passwordForm.nueva === passwordForm.confirmar
  const nivelPassword = passwordForm.nueva ? Math.max(1, reglasFuerzaPassword.filter((regla) => regla(passwordForm.nueva)).length) : 0
  const textoNivelPassword = ['', 'Muy débil', 'Débil', 'Media', 'Buena', 'Segura'][nivelPassword]
  const desactivarListo = checksDesactivar.revision && checksDesactivar.oculto && checksDesactivar.regreso
  const eliminarListo = checksEliminar.periodo && checksEliminar.cancelar && checksEliminar.permanente

  const cerrarSesion = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const onPasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value })
    setErroresPassword(({ [e.target.name]: _, general: __, ...resto }) => resto)
  }

  const bloquearPortapapeles = (e) => e.preventDefault()

  const guardarPassword = async (e) => {
    e.preventDefault()
    const errores = {}
    if (!passwordForm.actual) errores.actual = 'La contraseña actual es obligatoria'
    if (!passwordCumple) errores.nueva = 'La contraseña debe cumplir las reglas'
    if (!passwordForm.confirmar) errores.confirmar = 'Confirma la nueva contraseña'
    else if (passwordForm.nueva !== passwordForm.confirmar) errores.confirmar = 'Las contraseñas no coinciden'

    setErroresPassword(errores)
    if (Object.keys(errores).length > 0) return

    setGuardandoPassword(true)
    const resultado = await authService.cambiarPasswordAutenticado(passwordForm.actual, passwordForm.nueva)
    setGuardandoPassword(false)

    if (!resultado.exito) {
      const mensaje = resultado.status
        ? 'Contraseña incorrecta'
        : 'Ups, algo salió mal. Inténtalo más tarde'
      setErroresPassword({ actual: mensaje })
      return
    }

    setPasswordForm({ actual: '', nueva: '', confirmar: '' })
    setErroresPassword({})
    setPopExito('Contraseña actualizada')
    window.setTimeout(() => setPopExito(''), 1800)
  }

  const cambiarCheckDesactivar = (e) => {
    setChecksDesactivar({ ...checksDesactivar, [e.target.name]: e.target.checked })
  }

  const abrirConfirmacionDesactivar = () => {
    setPasswordDesactivar('')
    setErrorPasswordDesactivar('')
    setPasswordDesactivarValida(false)
    setConfirmarDesactivar(true)
  }

  const cerrarConfirmacionDesactivar = () => {
    if (desactivandoCuenta) return
    setConfirmarDesactivar(false)
    setPasswordDesactivar('')
    setErrorPasswordDesactivar('')
    setPasswordDesactivarValida(false)
  }

  const onPasswordDesactivarChange = (e) => {
    setPasswordDesactivar(e.target.value)
    setErrorPasswordDesactivar('')
    setPasswordDesactivarValida(false)
  }

  const onPasswordEliminarChange = (e) => {
    setPasswordEliminar(e.target.value)
    setPasswordEliminacionValida(false)
    setErrorEliminar('')
  }

  const cambiarCheckEliminar = (e) => {
    setChecksEliminar({ ...checksEliminar, [e.target.name]: e.target.checked })
  }

  const verificarPasswordEliminar = async (e) => {
    e.preventDefault()
    if (!passwordEliminar) {
      setErrorEliminar('La contraseña es obligatoria')
      return
    }

    setVerificandoEliminar(true)
    const resultado = await authService.verificarPassword(passwordEliminar)
    setVerificandoEliminar(false)

    if (!resultado.exito) {
      setErrorEliminar(resultado.status ? 'Contraseña incorrecta' : 'Ups, algo salió mal. Inténtalo más tarde')
      setPasswordEliminacionValida(false)
      return
    }

    setErrorEliminar('')
    setPasswordEliminacionValida(true)
    setConfirmarEliminar(true)
  }

  const cerrarConfirmacionEliminar = () => {
    if (eliminandoCuenta) return
    setConfirmarEliminar(false)
  }

  const confirmarPasswordDesactivar = async (e) => {
    e?.preventDefault()
    if (!desactivarListo || desactivandoCuenta) return
    if (!passwordDesactivar) {
      setErrorPasswordDesactivar('La contraseña es obligatoria')
      return
    }

    setDesactivandoCuenta(true)
    setErrorDesactivar('')
    setErrorPasswordDesactivar('')

    const passwordValida = await authService.verificarPassword(passwordDesactivar)
    if (!passwordValida.exito) {
      setDesactivandoCuenta(false)
      setErrorPasswordDesactivar(passwordValida.status ? 'Contraseña incorrecta' : 'Ups, algo salió mal. Inténtalo más tarde')
      return
    }

    setDesactivandoCuenta(false)
    setPasswordDesactivarValida(true)
  }

  const desactivarCuenta = async () => {
    if (!desactivarListo || desactivandoCuenta || !passwordDesactivarValida) return

    setDesactivandoCuenta(true)
    setErrorDesactivar('')
    await esperarCargaBreve()
    const resultado = await authService.desactivarCuenta('Desactivación solicitada por el usuario desde configuración')
    setDesactivandoCuenta(false)

    if (!resultado.exito) {
      setErrorDesactivar(resultado.mensaje || 'Ups, algo salió mal. Inténtalo más tarde')
      setConfirmarDesactivar(false)
      return
    }

    logout()
    navigate('/login', { replace: true })
  }

  const eliminarCuenta = async () => {
    if (!eliminarListo || eliminandoCuenta || !passwordEliminacionValida) return

    setEliminandoCuenta(true)
    setErrorEliminar('')
    await esperarCargaBreve()
    const resultado = await authService.eliminarCuenta('Eliminación solicitada por el usuario desde configuración')
    setEliminandoCuenta(false)

    if (!resultado.exito) {
      setErrorEliminar(resultado.mensaje || 'Ups, algo salió mal. Inténtalo más tarde')
      setConfirmarEliminar(false)
      return
    }

    logout()
    navigate('/login', { replace: true })
  }

  return (
    <main className="app-shell">
      <AppSidebar activo="Configuracion" />

      <section className="settings-page" aria-label="Configuracion">
        <header className="settings-header">
          <p className="feed-kicker">Mi cuenta</p>
          <h1>Configuracion</h1>
          <span>Administra como se ve, se protege y se comporta tu experiencia en Moment.</span>
        </header>

        <div className={`settings-layout${detalle ? ' con-detalle' : ''}`}>
          {!detalle && (
          <div>
            <div className={`settings-master ${detalle ? 'detail-mode' : ''}`}>
              {!detalle && !seccion ? (
                <div className="settings-list settings-main-list">
                  {ajustes.map((ajuste) => (
                    <div className="settings-item" key={ajuste.titulo}>
                      <button
                        className="settings-row"
                        onClick={ajuste.titulo === 'Cuenta' ? () => setSeccion('cuenta') : undefined}
                      >
                        <span>
                          <strong>{ajuste.titulo}</strong>
                          <small>{ajuste.descripcion}</small>
                        </span>
                        <i>›</i>
                      </button>
                    </div>
                  ))}
                </div>
              ) : !detalle && seccion === 'cuenta' ? (
                <div className="settings-list settings-main-list settings-section-list">
                  <button className="back-row settings-back-row" onClick={() => setSeccion('')}>‹ Volver a configuracion</button>
                  <div className="settings-section-head">
                    <p className="feed-kicker">Cuenta</p>
                    <h3>Cuenta</h3>
                    <span>Administra los accesos y el estado de tu cuenta.</span>
                  </div>

                  <div className="account-group">
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

                  <div className="account-group account-danger-group">
                    <span className="account-group-label">Acciones de cuenta</span>
                    {accionesCuenta.map((opcion) => (
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
              ) : null}
            </div>

            {!detalle && !seccion && (
              <section className="logout-section">
                <div>
                  <strong>Cerrar sesion</strong>
                  <p>Sal de tu cuenta en este dispositivo.</p>
                </div>
                <button className="danger-btn" onClick={() => setConfirmarSalida(true)}>Cerrar sesion</button>
              </section>
            )}
          </div>
          )}

          {detalle && (
          <section className="settings-detail" aria-label="Detalle de configuracion">
            <button className="back-row settings-detail-back" onClick={() => setDetalle('')}>‹ Volver a cuenta</button>
            {detalle === 'password' && (
              <>
                <p className="feed-kicker">Cuenta</p>
                <h2>Cambiar contraseña</h2>
                <p className="detail-copy">Actualiza tu contraseña. Te enviaremos un aviso por correo cuando se guarde el cambio.</p>
                <form className="detail-form" onSubmit={guardarPassword} noValidate>
                  <div className="campo">
                    <CampoPassword invalido={Boolean(erroresPassword.actual)} name="actual" placeholder="Contraseña actual" aria-label="Contraseña actual" value={passwordForm.actual} onChange={onPasswordChange} autoComplete="current-password" maxLength={72} disabled={guardandoPassword} />
                    {erroresPassword.actual && <span className="campo-error">{erroresPassword.actual}</span>}
                  </div>
                  <div className="campo">
                    <CampoPassword invalido={Boolean(erroresPassword.nueva)} name="nueva" placeholder="Nueva contraseña" aria-label="Nueva contraseña" value={passwordForm.nueva} onChange={onPasswordChange} autoComplete="new-password" maxLength={72} disabled={guardandoPassword} onCopy={bloquearPortapapeles} onCut={bloquearPortapapeles} onPaste={bloquearPortapapeles} />
                    {erroresPassword.nueva && <span className="campo-error">{erroresPassword.nueva}</span>}
                  </div>
                  <div className="campo">
                    <CampoPassword invalido={noCoinciden || Boolean(erroresPassword.confirmar)} name="confirmar" placeholder="Confirmar nueva contraseña" aria-label="Confirmar nueva contraseña" value={passwordForm.confirmar} onChange={onPasswordChange} autoComplete="new-password" maxLength={72} disabled={guardandoPassword} onCopy={bloquearPortapapeles} onCut={bloquearPortapapeles} onPaste={bloquearPortapapeles} />
                    {(noCoinciden || erroresPassword.confirmar) && <span className="campo-error">{erroresPassword.confirmar || 'Las contraseñas no coinciden'}</span>}
                    <div className={`password-meter nivel-${nivelPassword}`} aria-live="polite">
                      {Array.from({ length: 5 }).map((_, index) => <span key={index} />)}
                      {textoNivelPassword && <strong>{textoNivelPassword}</strong>}
                    </div>
                    <ul className="password-rules" aria-label="Reglas de contraseña">
                      {reglasPassword.map((regla) => <li className={regla.valida(passwordForm.nueva) ? 'cumple' : ''} key={regla.id}>{regla.texto}</li>)}
                    </ul>
                  </div>
                  <button disabled={guardandoPassword || !passwordLista}>{guardandoPassword ? <span className="spinner" /> : 'Guardar cambios'}</button>
                </form>
              </>
            )}

            {detalle === 'desactivar' && (
              <>
                <p className="feed-kicker">Cuenta</p>
                <h2>Desactivar cuenta</h2>
                <p className="detail-copy">Tu perfil quedaria oculto temporalmente y podrias volver cuando inicies sesion de nuevo.</p>
                <p className="detail-note warning"><strong>Antes de continuar:</strong> tu cuenta aun puede ser revisada por seguridad y moderacion si existen reportes pendientes.</p>
                <div className="account-checkpoints" aria-label="Confirmaciones para desactivar cuenta">
                  <label>
                    <input type="checkbox" name="revision" checked={checksDesactivar.revision} onChange={cambiarCheckDesactivar} />
                    <span>Entiendo que mi cuenta puede seguir en revision por seguridad.</span>
                  </label>
                  <label>
                    <input type="checkbox" name="oculto" checked={checksDesactivar.oculto} onChange={cambiarCheckDesactivar} />
                    <span>Entiendo que mi perfil y momentos dejaran de estar visibles.</span>
                  </label>
                  <label>
                    <input type="checkbox" name="regreso" checked={checksDesactivar.regreso} onChange={cambiarCheckDesactivar} />
                    <span>Entiendo que podre volver iniciando sesion nuevamente.</span>
                  </label>
                </div>
                {errorDesactivar && <span className="campo-error">{errorDesactivar}</span>}
                <button className="warning-btn" onClick={abrirConfirmacionDesactivar} disabled={!desactivarListo || desactivandoCuenta}>
                  Desactivar cuenta
                </button>
              </>
            )}

            {detalle === 'eliminar' && (
              <>
                <p className="feed-kicker">Cuenta</p>
                <h2>Eliminar cuenta</h2>
                <p className="detail-copy">Lamentamos que quieras irte. Si algo no funciono como esperabas, puedes desactivar la cuenta y volver despues.</p>
                <p className="detail-note danger"><strong>Antes de continuar:</strong> tu cuenta entrara en un periodo de 30 dias antes de eliminarse definitivamente.</p>
                <div className="account-checkpoints" aria-label="Confirmaciones para eliminar cuenta">
                  <label>
                    <input type="checkbox" name="periodo" checked={checksEliminar.periodo} onChange={cambiarCheckEliminar} />
                    <span>Entiendo que mi cuenta quedara programada para eliminarse en 30 dias.</span>
                  </label>
                  <label>
                    <input type="checkbox" name="cancelar" checked={checksEliminar.cancelar} onChange={cambiarCheckEliminar} />
                    <span>Entiendo que durante esos 30 dias podre cancelar la eliminacion al reingresar.</span>
                  </label>
                  <label>
                    <input type="checkbox" name="permanente" checked={checksEliminar.permanente} onChange={cambiarCheckEliminar} />
                    <span>Entiendo que despues de los 30 dias la cuenta se eliminara para siempre.</span>
                  </label>
                </div>
                <form className="detail-form" onSubmit={verificarPasswordEliminar} noValidate>
                  <div className="campo">
                    <CampoPassword invalido={Boolean(errorEliminar)} name="passwordEliminar" placeholder="Contraseña actual" aria-label="Contraseña actual" value={passwordEliminar} onChange={onPasswordEliminarChange} autoComplete="current-password" maxLength={72} disabled={verificandoEliminar || passwordEliminacionValida || !eliminarListo} />
                    {errorEliminar && <span className="campo-error">{errorEliminar}</span>}
                    {passwordEliminacionValida && <span className="campo-ayuda estado-usuario disponible">Contraseña verificada</span>}
                  </div>
                  <button className="danger-btn" disabled={verificandoEliminar || !passwordEliminar || !eliminarListo || passwordEliminacionValida}>
                    {verificandoEliminar ? <span className="spinner" /> : 'Eliminar cuenta'}
                  </button>
                </form>
              </>
            )}

            {detalle === 'sesiones' && (
              <>
                <p className="feed-kicker">Cuenta</p>
                <h2>Mis inicios de sesión</h2>
                <p className="detail-copy">Aqui mostraremos los dispositivos, ubicaciones aproximadas y fechas de acceso recientes.</p>
                <div className="detail-list">
                  <div>
                    <strong>Este dispositivo</strong>
                    <span>Windows · Sesion actual</span>
                  </div>
                  <div>
                    <strong>Ultimo acceso registrado</strong>
                    <span>Hoy · Navegador principal</span>
                  </div>
                </div>
              </>
            )}

            {detalle === 'email' && (
              <>
                <p className="feed-kicker">Cuenta</p>
                <h2>Correo electrónico</h2>
                <p className="detail-copy">Aqui podremos cambiar el correo usando verificacion de seguridad antes de guardar.</p>
                <div className="detail-form">
                  <input type="email" placeholder="Correo actual" autoComplete="email" maxLength={100} />
                  <input type="email" placeholder="Nuevo correo" autoComplete="email" maxLength={100} />
                  <button>Enviar verificacion</button>
                </div>
              </>
            )}

            {detalle === 'actividad' && (
              <>
                <p className="feed-kicker">Cuenta</p>
                <h2>Actividad de la cuenta</h2>
                <p className="detail-copy">Registro de acciones importantes para auditoria y seguridad del usuario.</p>
                <div className="detail-list">
                  <div>
                    <strong>Contraseña actualizada</strong>
                    <span>Pendiente de conectar con backend.</span>
                  </div>
                  <div>
                    <strong>Foto de perfil modificada</strong>
                    <span>Pendiente de historial real.</span>
                  </div>
                </div>
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

      {confirmarDesactivar && (
        <div className="modal-backdrop" role="presentation" onClick={cerrarConfirmacionDesactivar}>
          <section className="confirm-modal" role="dialog" aria-modal="true" aria-label="Confirmar desactivacion" onClick={(e) => e.stopPropagation()}>
            {!passwordDesactivarValida ? (
              <>
                <h2>Desactivar cuenta</h2>
                <p>¿Seguro que quieres desactivar tu cuenta? Confirma tu contraseña para continuar con el último paso.</p>
                <form className="confirm-form" onSubmit={confirmarPasswordDesactivar} noValidate>
                  <div className="campo">
                    <CampoPassword invalido={Boolean(errorPasswordDesactivar)} name="passwordDesactivar" placeholder="Contraseña actual" aria-label="Contraseña actual" value={passwordDesactivar} onChange={onPasswordDesactivarChange} autoComplete="current-password" maxLength={72} disabled={desactivandoCuenta} />
                    {errorPasswordDesactivar && <span className="campo-error">{errorPasswordDesactivar}</span>}
                  </div>
                  <div>
                    <button className="profile-btn" type="button" onClick={cerrarConfirmacionDesactivar} disabled={desactivandoCuenta}>Cancelar</button>
                    <button className="warning-btn" disabled={desactivandoCuenta || !passwordDesactivar}>
                      {desactivandoCuenta ? <span className="spinner" /> : 'Continuar'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="deactivate-final">
                <h2>Te vamos a extrañar</h2>
                <p>Tu cuenta quedará pausada. Tu perfil, tus momentos y tu actividad dejarán de mostrarse públicamente mientras esté desactivada.</p>
                <ul>
                  <li>Podrás volver iniciando sesión o recuperando tu contraseña.</li>
                  <li>Algunos datos pueden conservarse temporalmente por seguridad, reportes o auditoría.</li>
                  <li>No se eliminará tu cuenta de forma definitiva desde esta acción.</li>
                </ul>
                {errorDesactivar && <span className="campo-error">{errorDesactivar}</span>}
                <div>
                  <button className="profile-btn" type="button" onClick={cerrarConfirmacionDesactivar} disabled={desactivandoCuenta}>Cancelar</button>
                  <button className="warning-btn" type="button" onClick={desactivarCuenta} disabled={desactivandoCuenta}>
                    {desactivandoCuenta ? <span className="spinner" /> : 'Desactivar'}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {confirmarEliminar && (
        <div className="modal-backdrop" role="presentation" onClick={cerrarConfirmacionEliminar}>
          <section className="confirm-modal" role="dialog" aria-modal="true" aria-label="Confirmar eliminacion" onClick={(e) => e.stopPropagation()}>
            <div className="deactivate-final delete-final">
              <h2>Eliminar cuenta</h2>
              <p>Tu cuenta quedara oculta desde ahora y entrara en un periodo de seguridad de 30 dias antes de eliminarse por completo.</p>
              <ul>
                <li>Durante esos 30 dias podras cancelar la eliminacion si vuelves a entrar y confirmas que quieres conservarla.</li>
                <li>Despues de los 30 dias, la cuenta y la informacion asociada se eliminaran definitivamente.</li>
                <li>Algunos registros minimos podrian conservarse si son necesarios por seguridad, auditoria o reportes.</li>
              </ul>
              {errorEliminar && <span className="campo-error">{errorEliminar}</span>}
              <div>
                <button className="profile-btn" type="button" onClick={cerrarConfirmacionEliminar} disabled={eliminandoCuenta}>Cancelar</button>
                <button className="danger-btn" type="button" onClick={eliminarCuenta} disabled={eliminandoCuenta}>
                  {eliminandoCuenta ? <span className="spinner" /> : 'Si, eliminar'}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      <SuccessPop visible={Boolean(popExito)} mensaje={popExito} />

    </main>
  )
}
