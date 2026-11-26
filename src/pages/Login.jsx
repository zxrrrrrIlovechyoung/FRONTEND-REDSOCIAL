import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import CampoPassword from '../components/CampoPassword'
import { necesitaSelectorDeEntrada, rutaInicialPorRol } from '../utils/rutasPorRol'

const RECORDAR_USUARIO_KEY = 'moment_recordar_usuario'
export const REACTIVAR_CUENTA_KEY = 'moment_reactivar_cuenta'
const dominiosEmail = ['gmail.com', 'hotmail.com']
const loginImagenes = [
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1400&q=80',
]

const siguienteIntervaloImagen = () => Math.floor(45000 + Math.random() * 135000)

export default function Login() {
  const { login, estaAutenticado, usuario } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    usuarioOEmail: sessionStorage.getItem(RECORDAR_USUARIO_KEY) ?? '',
    password: '',
    recordarUsuario: Boolean(sessionStorage.getItem(RECORDAR_USUARIO_KEY)),
  })
  const [errores, setErrores] = useState({})
  const [cargando, setCargando] = useState(false)
  const [intentoFallido, setIntentoFallido] = useState(false)
  const [entrandoARegistro, setEntrandoARegistro] = useState(false)
  const [entrandoARecuperar, setEntrandoARecuperar] = useState(false)
  const [imagenActiva, setImagenActiva] = useState(() => Math.floor(Math.random() * loginImagenes.length))

  useEffect(() => {
    let timer
    const programarCambio = () => {
      timer = window.setTimeout(() => {
        setImagenActiva((actual) => {
          let siguiente = Math.floor(Math.random() * loginImagenes.length)
          if (siguiente === actual) siguiente = (siguiente + 1) % loginImagenes.length
          return siguiente
        })
        programarCambio()
      }, siguienteIntervaloImagen())
    }

    programarCambio()
    return () => window.clearTimeout(timer)
  }, [])

  if (estaAutenticado) {
    if (necesitaSelectorDeEntrada(usuario)) return <Navigate to="/seleccionar-entrada" replace />
    return <Navigate to={rutaInicialPorRol(usuario?.rolActivo ?? usuario?.rol)} replace />
  }

  const onChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm({ ...form, [e.target.name]: value })
    setIntentoFallido(false)
    setErrores(({ [e.target.name]: _, general: __, ...resto }) => resto)
  }

  const alternarDominioEmail = (e) => {
    if (e.key !== 'Enter') return
    if (form.usuarioOEmail.includes('.') && form.usuarioOEmail.includes('@')) return

    e.preventDefault()
    const valor = form.usuarioOEmail.trim()
    const [usuario, dominioActual = ''] = valor.split('@')
    if (!usuario) return

    const indiceActual = dominiosEmail.indexOf(dominioActual.toLowerCase())
    const siguienteDominio = dominiosEmail[(indiceActual + 1) % dominiosEmail.length]
    setForm({ ...form, usuarioOEmail: `${usuario}@${siguienteDominio}` })
    setErrores(({ usuarioOEmail: _, general: __, ...resto }) => resto)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const nuevosErrores = {}
    if (!form.usuarioOEmail.trim()) nuevosErrores.usuarioOEmail = 'El correo es obligatorio'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.usuarioOEmail.trim())) nuevosErrores.usuarioOEmail = 'Ingresa un correo válido'
    if (!form.password) nuevosErrores.password = 'La contraseña es obligatoria'
    setErrores(nuevosErrores)
    setIntentoFallido(Object.keys(nuevosErrores).length > 0)
    if (Object.keys(nuevosErrores).length > 0) return

    setCargando(true)
    const resultado = await login(form.usuarioOEmail, form.password)
    setCargando(false)
    if (resultado.exito) {
      if (form.recordarUsuario) sessionStorage.setItem(RECORDAR_USUARIO_KEY, form.usuarioOEmail.trim())
      else sessionStorage.removeItem(RECORDAR_USUARIO_KEY)
      if (necesitaSelectorDeEntrada(resultado.datos)) navigate('/seleccionar-entrada')
      else navigate(rutaInicialPorRol(resultado.datos?.rolActivo ?? resultado.datos?.rol ?? 'usuario'))
    }
    else {
      if (resultado.mensaje === 'Cuenta desactivada') {
        sessionStorage.setItem(REACTIVAR_CUENTA_KEY, JSON.stringify({
          usuarioOEmail: form.usuarioOEmail.trim(),
          password: form.password,
          estadoCuenta: resultado.datos?.estadoCuenta,
          fechaDesactivacion: resultado.datos?.fechaDesactivacion,
          fechaEliminacion: resultado.datos?.fechaEliminacion,
        }))
        navigate('/cuenta-desactivada')
        return
      }

      setIntentoFallido(true)
      const mensaje = resultado.tipoError === 'red' || resultado.tipoError === 'servidor'
        ? 'Ups, algo salió mal. Inténtalo más tarde'
        : resultado.mensaje === 'Ups, algo salió mal. Inténtalo más tarde'
        ? resultado.mensaje
        : 'Usuario o contraseña incorrectos'
      setErrores({ password: mensaje })
    }
  }

  const irARegistro = () => {
    if (entrandoARegistro || entrandoARecuperar || cargando) return
    setEntrandoARegistro(true)
    window.setTimeout(() => navigate('/registro'), 520)
  }

  const irARecuperarPassword = () => {
    if (entrandoARegistro || entrandoARecuperar || cargando) return
    setEntrandoARecuperar(true)
    window.setTimeout(() => navigate('/recuperar-password'), 520)
  }

  return (
    <main className={`auth login-layout${entrandoARegistro ? ' auth-to-register' : ''}${entrandoARecuperar ? ' auth-to-recover' : ''}`}>
      <section className="login-visual" aria-hidden="true">
        <img key={loginImagenes[imagenActiva]} src={loginImagenes[imagenActiva]} alt="" />
        <div>
          <span>Moment</span>
          <h2>Comparte lo que esta pasando en tu dia.</h2>
          <p>Fotos, pensamientos y conversaciones en un solo lugar.</p>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-panel-inner">
          <div className="card login-card">
            <div className="auth-brand">
              <span className="brand-mark">M</span>
              <strong>Moment</strong>
            </div>

            <h1 className="card-titulo">Bienvenido</h1>
            <p className="card-sub">Vuelve a tus momentos, chats y pensamientos favoritos.</p>

            <form className={intentoFallido ? 'form-soft-error' : ''} onSubmit={onSubmit} noValidate>
              <div className="campo">
                <input
                  className={`input${errores.usuarioOEmail ? ' invalido' : ''}`}
                  name="usuarioOEmail" type="email" placeholder="Correo electrónico" aria-label="Correo electrónico"
                  value={form.usuarioOEmail} onChange={onChange} onKeyDown={alternarDominioEmail} autoComplete="email" maxLength={100} disabled={cargando}
                />
                {errores.usuarioOEmail && <span className="campo-error">{errores.usuarioOEmail}</span>}
              </div>
              <div className="campo">
                <CampoPassword
                  invalido={Boolean(errores.password)}
                  name="password" placeholder="Contraseña" aria-label="Contraseña"
                  value={form.password} onChange={onChange} autoComplete="current-password" maxLength={72} disabled={cargando}
                />
                {errores.password && <span className="campo-error">{errores.password}</span>}
              </div>

              <div className="login-options">
                <label className="check-row">
                  <input
                    type="checkbox"
                    name="recordarUsuario"
                    checked={form.recordarUsuario}
                    onChange={onChange}
                    disabled={cargando}
                  />
                  <span>Recordar correo</span>
                </label>
                <button className="auth-link-button" type="button" onClick={irARecuperarPassword} disabled={entrandoARegistro || entrandoARecuperar || cargando}>
                  Olvidé mi contraseña
                </button>
              </div>

              <button className="btn" disabled={cargando}>
                {cargando ? <span className="spinner" /> : 'Iniciar sesión'}
              </button>
            </form>

            <div className="divisor" />
            <p className="pie">
              ¿No tienes cuenta?{' '}
              <button className="auth-link-button" type="button" onClick={irARegistro} disabled={entrandoARegistro || entrandoARecuperar || cargando}>
                Regístrate
              </button>
            </p>
          </div>

          <footer className="auth-footer">
            <span>© 2026 Moment</span>
            <a href="#">Privacidad</a>
            <a href="#">Términos</a>
            <a href="#">Ayuda</a>
          </footer>
        </div>
      </section>
    </main>
  )
}
