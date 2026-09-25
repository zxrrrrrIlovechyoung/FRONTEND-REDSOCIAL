import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import CampoPassword from '../components/CampoPassword'

const edadMinima = 12

const calcularEdad = (fecha) => {
  if (!fecha) return 0
  const nacimiento = new Date(fecha)
  const hoy = new Date()
  let edad = hoy.getFullYear() - nacimiento.getFullYear()
  const mes = hoy.getMonth() - nacimiento.getMonth()
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad -= 1
  return edad
}

export default function Registro() {
  const { registrar, estaAutenticado } = useAuth()
  const navigate = useNavigate()
  const [paso, setPaso] = useState(1)
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmar: '',
    fechaNacimiento: '',
    nombrePerfil: '',
    nombreUsuario: '',
  })
  const [errores, setErrores] = useState({})
  const [cargando, setCargando] = useState(false)
  const [cuentaCreada, setCuentaCreada] = useState(false)

  useEffect(() => {
    if (!cuentaCreada) return undefined
    const timer = setTimeout(() => navigate('/login', { replace: true }), 2000)
    return () => clearTimeout(timer)
  }, [cuentaCreada, navigate])

  if (estaAutenticado) return <Navigate to="/" replace />

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrores(({ [e.target.name]: _, general: __, ...resto }) => resto)
  }

  const noCoinciden = form.confirmar !== '' && form.password !== form.confirmar
  const edad = calcularEdad(form.fechaNacimiento)

  const validarPaso = (pasoActual) => {
    const nuevosErrores = {}

    if (pasoActual === 1) {
      if (!form.email.trim()) nuevosErrores.email = 'El correo es obligatorio'
      if (!form.password) nuevosErrores.password = 'La contraseña es obligatoria'
      if (!form.confirmar) nuevosErrores.confirmar = 'Confirma tu contraseña'
      else if (form.password !== form.confirmar) nuevosErrores.confirmar = 'Las contraseñas no coinciden'
    }

    if (pasoActual === 2) {
      if (!form.fechaNacimiento) nuevosErrores.fechaNacimiento = 'La fecha de nacimiento es obligatoria'
      else if (edad < edadMinima) nuevosErrores.fechaNacimiento = 'Debes tener al menos 12 años'
    }

    if (pasoActual === 3) {
      if (!form.nombrePerfil.trim()) nuevosErrores.nombrePerfil = 'El nombre de perfil es obligatorio'
      if (!form.nombreUsuario.trim()) nuevosErrores.nombreUsuario = 'El nombre de usuario es obligatorio'
      else if (form.nombreUsuario.trim().length < 3) nuevosErrores.nombreUsuario = 'Debe tener al menos 3 caracteres'
    }

    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  const siguiente = () => {
    if (validarPaso(paso)) setPaso((actual) => Math.min(actual + 1, 3))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!validarPaso(3)) return

    setCargando(true)
    const datos = {
      email: form.email,
      password: form.password,
      nombreUsuario: form.nombreUsuario,
    }
    const resultado = await registrar(datos)
    setCargando(false)
    if (resultado.exito) setCuentaCreada(true)
    else setErrores({ nombreUsuario: resultado.mensaje })
  }

  return (
    <main className="auth">
      {!cuentaCreada && (
        <div className="card">
          <div className="auth-brand">
            <span className="brand-mark">M</span>
            <strong>Moment</strong>
          </div>

          <div className="steps">
            {[1, 2, 3].map((item) => <span className={paso >= item ? 'activo' : ''} key={item} />)}
          </div>

          <h1 className="card-titulo">Crea tu cuenta</h1>
          <p className="card-sub">
            {paso === 1 && 'Empieza con el correo y una contraseña segura.'}
            {paso === 2 && 'Cuéntanos tu fecha de nacimiento para cuidar tu experiencia.'}
            {paso === 3 && 'Elige cómo quieres aparecer en Moment.'}
          </p>

          <form onSubmit={onSubmit}>
            {paso === 1 && (
              <>
                <div className="campo">
                  <input
                    className={`input${errores.email ? ' invalido' : ''}`} name="email" type="email" placeholder="Correo electrónico" aria-label="Correo electrónico"
                    value={form.email} onChange={onChange} autoComplete="email" required maxLength={100} disabled={cargando}
                  />
                  {errores.email && <span className="campo-error">{errores.email}</span>}
                </div>
                <div className="campo">
                  <CampoPassword
                    invalido={Boolean(errores.password)}
                    name="password" placeholder="Contraseña" aria-label="Contraseña"
                    value={form.password} onChange={onChange} autoComplete="new-password" required maxLength={72} disabled={cargando}
                  />
                  {errores.password && <span className="campo-error">{errores.password}</span>}
                </div>
                <div className="campo">
                  <CampoPassword
                    invalido={noCoinciden || Boolean(errores.confirmar)}
                    name="confirmar" placeholder="Confirmar contraseña" aria-label="Confirmar contraseña"
                    value={form.confirmar} onChange={onChange} autoComplete="new-password" required maxLength={72} disabled={cargando}
                  />
                  {(noCoinciden || errores.confirmar) && <span className="campo-error">{errores.confirmar || 'Las contraseñas no coinciden'}</span>}
                </div>
              </>
            )}

            {paso === 2 && (
              <div className="campo">
                <input
                  className={`input${errores.fechaNacimiento || (form.fechaNacimiento && edad < edadMinima) ? ' invalido' : ''}`}
                  name="fechaNacimiento" type="date" aria-label="Fecha de nacimiento"
                  value={form.fechaNacimiento} onChange={onChange} required disabled={cargando}
                />
                <span className="campo-ayuda">Debes tener al menos 12 años para usar Moment.</span>
                {errores.fechaNacimiento && <span className="campo-error">{errores.fechaNacimiento}</span>}
              </div>
            )}

            {paso === 3 && (
              <>
                <div className="campo">
                  <input
                    className={`input${errores.nombrePerfil ? ' invalido' : ''}`} name="nombrePerfil" placeholder="Nombre de perfil" aria-label="Nombre de perfil"
                    value={form.nombrePerfil} onChange={onChange} required minLength={2} maxLength={60} disabled={cargando}
                  />
                  <span className="campo-ayuda">Este será tu nombre de perfil.</span>
                  {errores.nombrePerfil && <span className="campo-error">{errores.nombrePerfil}</span>}
                </div>
                <div className="campo">
                  <div className="username-field">
                    <span>@</span>
                    <input
                      className={`input${errores.nombreUsuario ? ' invalido' : ''}`} name="nombreUsuario" placeholder="usuario" aria-label="Nombre de usuario único"
                      value={form.nombreUsuario} onChange={onChange} required minLength={3} maxLength={30} disabled={cargando}
                    />
                  </div>
                  <span className="campo-ayuda">Este será tu @usuario y debe ser único.</span>
                  {errores.nombreUsuario && <span className="campo-error">{errores.nombreUsuario}</span>}
                </div>
              </>
            )}

            <div className="registro-actions">
              {paso > 1 && (
                <button className="btn-secundario" type="button" onClick={() => setPaso((actual) => actual - 1)} disabled={cargando}>
                  Atrás
                </button>
              )}
              {paso < 3 ? (
                <button className="btn" type="button" onClick={siguiente} disabled={cargando}>Continuar</button>
              ) : (
                <button className="btn" disabled={cargando}>
                  {cargando ? <span className="spinner" /> : 'Crear cuenta'}
                </button>
              )}
            </div>
          </form>

          <div className="divisor" />
          <p className="pie">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
        </div>
      )}

      {cuentaCreada && (
        <button className="success-pop" onClick={() => navigate('/login', { replace: true })}>
          <span>➜</span>
          <strong>Cuenta creada con éxito</strong>
          <small>Te llevaremos al login en un momento</small>
        </button>
      )}
    </main>
  )
}
