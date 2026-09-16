import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import CampoPassword from '../components/CampoPassword'

export default function Registro() {
  const { registrar, estaAutenticado } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ nombreUsuario: '', email: '', password: '', confirmar: '' })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  if (estaAutenticado) return <Navigate to="/" replace />

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }
  const noCoinciden = form.confirmar !== '' && form.password !== form.confirmar

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmar) return setError('Las contraseñas no coinciden')

    setCargando(true)
    const { confirmar: _, ...datos } = form
    const resultado = await registrar(datos)
    setCargando(false)
    if (resultado.exito) navigate('/login', { replace: true, state: { mensaje: resultado.mensaje } })
    else setError(resultado.mensaje)
  }

  return (
    <main className="auth">
      <div className="card">
        <h1 className="card-titulo">Crea tu cuenta</h1>
        <p className="card-sub">Regístrate para empezar</p>

        <form onSubmit={onSubmit}>
          <div className="campo">
            <input
              className="input" name="nombreUsuario" placeholder="Nombre de usuario" aria-label="Nombre de usuario"
              value={form.nombreUsuario} onChange={onChange} required minLength={3} maxLength={30} disabled={cargando}
            />
          </div>
          <div className="campo">
            <input
              className="input" name="email" type="email" placeholder="Correo electrónico" aria-label="Correo electrónico"
              value={form.email} onChange={onChange} autoComplete="email" required maxLength={100} disabled={cargando}
            />
          </div>
          <div className="campo">
            <CampoPassword
              name="password" placeholder="Contraseña" aria-label="Contraseña"
              value={form.password} onChange={onChange} autoComplete="new-password" required maxLength={72} disabled={cargando}
            />
          </div>
          <div className="campo">
            <CampoPassword
              invalido={noCoinciden}
              name="confirmar" placeholder="Confirmar contraseña" aria-label="Confirmar contraseña"
              value={form.confirmar} onChange={onChange} autoComplete="new-password" required maxLength={72} disabled={cargando}
            />
            {noCoinciden && <span className="campo-error">Las contraseñas no coinciden</span>}
          </div>

          {error && <p className="alerta">{error}</p>}

          <button className="btn" disabled={cargando}>
            {cargando ? <span className="spinner" /> : 'Registrarme'}
          </button>
        </form>

        <div className="divisor" />
        <p className="pie">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
      </div>
    </main>
  )
}
