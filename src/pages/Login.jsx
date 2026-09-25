import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import CampoPassword from '../components/CampoPassword'

export default function Login() {
  const { login, estaAutenticado } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ usuarioOEmail: '', password: '' })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  if (estaAutenticado) return <Navigate to="/" replace />

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setCargando(true)
    const resultado = await login(form.usuarioOEmail, form.password)
    setCargando(false)
    if (resultado.exito) navigate('/')
    else setError(resultado.mensaje)
  }

  return (
    <main className="auth">
      <div className="card">
        <div className="auth-brand">
          <span className="brand-mark">M</span>
          <strong>Moment</strong>
        </div>

        <h1 className="card-titulo">Bienvenido</h1>
        <p className="card-sub">Vuelve a tus momentos, chats y pensamientos favoritos.</p>

        <form onSubmit={onSubmit}>
          <div className="campo">
            <input
              className={`input${error ? ' invalido' : ''}`}
              name="usuarioOEmail" placeholder="Usuario o correo electrónico" aria-label="Usuario o correo electrónico"
              value={form.usuarioOEmail} onChange={onChange} autoComplete="username" required maxLength={100} disabled={cargando}
            />
          </div>
          <div className="campo">
            <CampoPassword
              invalido={Boolean(error)}
              name="password" placeholder="Contraseña" aria-label="Contraseña"
              value={form.password} onChange={onChange} autoComplete="current-password" required maxLength={72} disabled={cargando}
            />
            {error && <span className="campo-error">{error}</span>}
          </div>

          <button className="btn" disabled={cargando}>
            {cargando ? <span className="spinner" /> : 'Iniciar sesión'}
          </button>
        </form>

        <div className="divisor" />
        <p className="pie">¿No tienes cuenta? <Link to="/registro">Regístrate</Link></p>
      </div>
    </main>
  )
}
