import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import CampoPassword from '../components/CampoPassword'

export default function Login() {
  const { login, estaAutenticado } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ usuarioOEmail: '', password: '' })
  const [errores, setErrores] = useState({})
  const [cargando, setCargando] = useState(false)

  if (estaAutenticado) return <Navigate to="/inicio" replace />

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrores(({ [e.target.name]: _, general: __, ...resto }) => resto)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const nuevosErrores = {}
    if (!form.usuarioOEmail.trim()) nuevosErrores.usuarioOEmail = 'El usuario o correo es obligatorio'
    if (!form.password) nuevosErrores.password = 'La contraseña es obligatoria'
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) return

    setCargando(true)
    const resultado = await login(form.usuarioOEmail, form.password)
    setCargando(false)
    if (resultado.exito) navigate('/inicio')
    else setErrores({ password: resultado.mensaje })
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

            <form onSubmit={onSubmit} noValidate>
              <div className="campo">
                <input
                  className={`input${errores.usuarioOEmail ? ' invalido' : ''}`}
                  name="usuarioOEmail" placeholder="Usuario o correo electrónico" aria-label="Usuario o correo electrónico"
                  value={form.usuarioOEmail} onChange={onChange} autoComplete="username" maxLength={100} disabled={cargando}
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
