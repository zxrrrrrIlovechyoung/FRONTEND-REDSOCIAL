import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import CampoPassword from '../components/CampoPassword'
import { necesitaSelectorDeEntrada, rutaInicialPorRol } from '../utils/rutasPorRol'

const RECORDAR_USUARIO_KEY = 'moment_recordar_usuario'
const dominiosEmail = ['gmail.com', 'hotmail.com']

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
      setIntentoFallido(true)
      const mensaje = resultado.mensaje === 'Ups, algo salió mal. Inténtalo más tarde'
        ? resultado.mensaje
        : 'Usuario u contraseña incorrectas'
      setErrores({ password: mensaje })
    }
  }

  return (
    <main className="auth login-layout">
      <section className="login-visual" aria-hidden="true">
        <img src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=80" alt="" />
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
                <Link to="/recuperar-password">Olvidé mi contraseña</Link>
              </div>

              <button className="btn" disabled={cargando}>
                {cargando ? <span className="spinner" /> : 'Iniciar sesión'}
              </button>
            </form>

            <div className="divisor" />
            <p className="pie">¿No tienes cuenta? <Link to="/registro">Regístrate</Link></p>
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
