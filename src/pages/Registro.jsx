import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import CampoPassword from '../components/CampoPassword'

const edadMinima = 12
const dominiosEmail = ['gmail.com', 'hotmail.com']
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
const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5079/api'

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
  const { registrar, solicitarCodigoEmail, verificarCodigoEmail, cancelarCodigoEmail, estaAutenticado } = useAuth()
  const navigate = useNavigate()
  const [paso, setPaso] = useState(1)
  const [form, setForm] = useState({
    email: '',
    codigo: '',
    password: '',
    confirmar: '',
    fechaNacimiento: '',
    nombrePerfil: '',
    nombreUsuario: '',
  })
  const [verificationToken, setVerificationToken] = useState('')
  const [errores, setErrores] = useState({})
  const [cargando, setCargando] = useState(false)
  const [estadoCodigo, setEstadoCodigo] = useState('idle')
  const [correoVerificado, setCorreoVerificado] = useState(false)
  const [cuentaCreada, setCuentaCreada] = useState(false)
  const codigoRefs = useRef([])

  useEffect(() => {
    if (!cuentaCreada) return undefined
    const timer = setTimeout(() => navigate('/login', { replace: true }), 2000)
    return () => clearTimeout(timer)
  }, [cuentaCreada, navigate])

  useEffect(() => {
    const debeLimpiar = paso > 1 && form.email.trim() && !cuentaCreada
    if (!debeLimpiar) return undefined

    const limpiarVerificacion = () => {
      const payload = JSON.stringify({ email: form.email.trim() })
      const blob = new Blob([payload], { type: 'application/json' })
      navigator.sendBeacon?.(`${apiUrl}/auth/registro/cancelar-codigo`, blob)
    }

    const advertirSalida = (event) => {
      limpiarVerificacion()
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', advertirSalida)
    return () => window.removeEventListener('beforeunload', advertirSalida)
  }, [cuentaCreada, form.email, paso])

  if (estaAutenticado) return <Navigate to="/" replace />

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrores(({ [e.target.name]: _, general: __, ...resto }) => resto)
  }

  const alternarDominioEmail = (e) => {
    if (e.key !== 'Enter') return
    e.preventDefault()

    const valor = form.email.trim()
    const [usuario, dominioActual = ''] = valor.split('@')
    if (!usuario) return

    const indiceActual = dominiosEmail.indexOf(dominioActual.toLowerCase())
    const siguienteDominio = dominiosEmail[(indiceActual + 1) % dominiosEmail.length]

    setForm({ ...form, email: `${usuario}@${siguienteDominio}` })
    setErrores(({ email: _, general: __, ...resto }) => resto)
  }

  const actualizarCodigo = (valor, index) => {
    const digito = valor.replace(/\D/g, '').slice(-1)
    const partes = form.codigo.padEnd(6, ' ').split('')
    partes[index] = digito || ' '
    const codigo = partes.join('').replace(/\s/g, '')

    setForm({ ...form, codigo })
    setEstadoCodigo('idle')
    setCorreoVerificado(false)
    setErrores(({ codigo: _, general: __, ...resto }) => resto)

    if (digito && index < 5) codigoRefs.current[index + 1]?.focus()
    if (digito && index === 5 && codigo.length === 6) {
      verificarCodigo(codigo)
    }
  }

  const manejarTeclaCodigo = (e, index) => {
    if (e.key === 'Backspace' && !form.codigo[index] && index > 0) {
      codigoRefs.current[index - 1]?.focus()
    }
  }

  const pegarCodigo = (e) => {
    e.preventDefault()
    const codigo = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!codigo) return
    setForm({ ...form, codigo })
    setEstadoCodigo('idle')
    setCorreoVerificado(false)
    setErrores(({ codigo: _, general: __, ...resto }) => resto)
    codigoRefs.current[Math.min(codigo.length, 5)]?.focus()
    if (codigo.length === 6) verificarCodigo(codigo)
  }

  const noCoinciden = form.confirmar !== '' && form.password !== form.confirmar
  const edad = calcularEdad(form.fechaNacimiento)
  const reglasCumplidas = reglasPassword.filter((regla) => regla.valida(form.password)).length
  const passwordCumple = reglasCumplidas === reglasPassword.length
  const passwordPerfecta = passwordCumple && form.confirmar !== '' && form.password === form.confirmar
  const nivelPassword = form.password ? Math.max(1, reglasFuerzaPassword.filter((regla) => regla(form.password)).length) : 0
  const textoNivelPassword = ['', 'Muy débil', 'Débil', 'Media', 'Buena', 'Segura'][nivelPassword]
  const bloquearPortapapeles = (e) => e.preventDefault()

  const validarPaso = (pasoActual) => {
    const nuevosErrores = {}

    if (pasoActual === 1) {
      if (!form.email.trim()) nuevosErrores.email = 'El correo es obligatorio'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) nuevosErrores.email = 'Ingresa un correo válido'
    }

    if (pasoActual === 2) {
      if (!form.codigo.trim()) nuevosErrores.codigo = 'El código es obligatorio'
      else if (!/^\d{6}$/.test(form.codigo.trim())) nuevosErrores.codigo = 'El código debe tener 6 dígitos'
    }

    if (pasoActual === 3) {
      if (!form.password) nuevosErrores.password = 'La contraseña es obligatoria'
      else if (!passwordCumple) nuevosErrores.password = 'La contraseña aún no cumple las reglas'
      if (!form.confirmar) nuevosErrores.confirmar = 'Confirma tu contraseña'
      else if (form.password !== form.confirmar) nuevosErrores.confirmar = 'Las contraseñas no coinciden'
    }

    if (pasoActual === 4) {
      if (!form.fechaNacimiento) nuevosErrores.fechaNacimiento = 'La fecha de nacimiento es obligatoria'
      else if (edad < edadMinima) nuevosErrores.fechaNacimiento = 'Debes tener al menos 12 años'
      if (!form.nombrePerfil.trim()) nuevosErrores.nombrePerfil = 'El nombre de perfil es obligatorio'
      if (!form.nombreUsuario.trim()) nuevosErrores.nombreUsuario = 'El nombre de usuario es obligatorio'
      else if (form.nombreUsuario.trim().length < 3) nuevosErrores.nombreUsuario = 'Debe tener al menos 3 caracteres'
    }

    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  const verificarCodigo = async (codigoActual = form.codigo) => {
    if (!/^\d{6}$/.test(codigoActual.trim()) || cargando || correoVerificado) return

    setEstadoCodigo('validando')
    setCargando(true)
    const resultado = await verificarCodigoEmail(form.email.trim(), codigoActual.trim())
    setCargando(false)
    if (!resultado.exito) {
      setEstadoCodigo('error')
      setErrores({ codigo: resultado.mensaje })
      return
    }
    setEstadoCodigo('exito')
    setCorreoVerificado(true)
    setVerificationToken(resultado.datos?.verificationToken || '')
    window.setTimeout(() => setPaso(3), 1100)
  }

  const siguiente = async () => {
    if (!validarPaso(paso)) return

    if (paso === 1) {
      setCargando(true)
      const resultado = await solicitarCodigoEmail(form.email.trim())
      setCargando(false)
      if (!resultado.exito) {
        setErrores({ email: resultado.mensaje })
        return
      }
    }

    if (paso === 2) {
      await verificarCodigo()
      return
    }

    setPaso((actual) => Math.min(actual + 1, 4))
  }

  const retroceder = async () => {
    if (paso === 2) {
      setCargando(true)
      await cancelarCodigoEmail(form.email.trim())
      setCargando(false)
      setForm({ ...form, codigo: '' })
      setEstadoCodigo('idle')
      setCorreoVerificado(false)
      setErrores({})
      setPaso(1)
      return
    }

    setPaso((actual) => actual - 1)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!validarPaso(4)) return

    setCargando(true)
    const datos = {
      email: form.email.trim(),
      password: form.password,
      nombreUsuario: form.nombreUsuario.trim(),
      nombrePerfil: form.nombrePerfil.trim(),
      fechaNacimiento: form.fechaNacimiento,
      verificationToken,
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
            {[1, 2, 3, 4].map((item) => <span className={paso >= item ? 'activo' : ''} key={item} />)}
          </div>

          <h1 className="card-titulo">Crea tu cuenta</h1>
          <p className="card-sub">
            {paso === 1 && 'Primero confirma que tu correo es real.'}
            {paso === 2 && 'Ingresa el código que enviamos a tu correo.'}
            {paso === 3 && 'Crea una contraseña segura para tu cuenta.'}
            {paso === 4 && 'Elige cómo quieres aparecer en Moment.'}
          </p>

          <form onSubmit={onSubmit} noValidate>
            {paso === 1 && (
              <div className="campo">
                <input
                  className={`input${errores.email ? ' invalido' : ''}`} name="email" type="email" placeholder="Correo electrónico" aria-label="Correo electrónico"
                  value={form.email} onChange={onChange} onKeyDown={alternarDominioEmail} autoComplete="email" maxLength={100} disabled={cargando}
                />
                {errores.email && <span className="campo-error">{errores.email}</span>}
              </div>
            )}

            {paso === 2 && (
              <div className={`campo codigo-campo codigo-${estadoCodigo}`}>
                <div className="codigo-grid" onPaste={pegarCodigo}>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <input
                      key={index}
                      ref={(elemento) => { codigoRefs.current[index] = elemento }}
                      className="codigo-box"
                      style={{ '--delay': `${index * 55}ms` }}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      aria-label={`Dígito ${index + 1} del código`}
                      value={form.codigo[index] || ''}
                      onChange={(e) => actualizarCodigo(e.target.value, index)}
                      onKeyDown={(e) => manejarTeclaCodigo(e, index)}
                      disabled={cargando || correoVerificado}
                      maxLength={1}
                    />
                  ))}
                </div>
                {estadoCodigo === 'validando' && (
                  <span className="codigo-status"><span className="spinner oscuro" /> Validando código</span>
                )}
                {errores.codigo && <span className="campo-error">{errores.codigo}</span>}
                <span className="campo-ayuda">Ingresa solo los 6 números que llegaron a tu correo.</span>
              </div>
            )}

            {paso === 3 && (
              <>
                <div className="campo">
                  <CampoPassword
                    invalido={Boolean(errores.password)}
                    name="password" placeholder="Contraseña" aria-label="Contraseña"
                    value={form.password} onChange={onChange} autoComplete="new-password" maxLength={72} disabled={cargando}
                    onCopy={bloquearPortapapeles} onCut={bloquearPortapapeles} onPaste={bloquearPortapapeles}
                  />
                  {errores.password && <span className="campo-error">{errores.password}</span>}
                </div>
                <div className="campo">
                  <CampoPassword
                    invalido={noCoinciden || Boolean(errores.confirmar)}
                    name="confirmar" placeholder="Confirmar contraseña" aria-label="Confirmar contraseña"
                    value={form.confirmar} onChange={onChange} autoComplete="new-password" maxLength={72} disabled={cargando}
                    onCopy={bloquearPortapapeles} onCut={bloquearPortapapeles} onPaste={bloquearPortapapeles}
                  />
                  {(noCoinciden || errores.confirmar) && <span className="campo-error">{errores.confirmar || 'Las contraseñas no coinciden'}</span>}
                  <div className={`password-meter nivel-${nivelPassword}`} aria-live="polite">
                    {Array.from({ length: 5 }).map((_, index) => <span key={index} />)}
                    {textoNivelPassword && <strong>{textoNivelPassword}</strong>}
                  </div>
                  <ul className="password-rules" aria-label="Reglas de contraseña">
                    {reglasPassword.map((regla) => (
                      <li className={regla.valida(form.password) ? 'cumple' : ''} key={regla.id}>
                        {regla.texto}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {paso === 4 && (
              <>
              <div className="campo">
                <input
                  className={`input${errores.fechaNacimiento || (form.fechaNacimiento && edad < edadMinima) ? ' invalido' : ''}`}
                  name="fechaNacimiento" type="date" aria-label="Fecha de nacimiento"
                  value={form.fechaNacimiento} onChange={onChange} disabled={cargando}
                />
                <span className="campo-ayuda">Debes tener al menos 12 años para usar Moment.</span>
                {errores.fechaNacimiento && <span className="campo-error">{errores.fechaNacimiento}</span>}
              </div>
                <div className="campo">
                  <input
                    className={`input${errores.nombrePerfil ? ' invalido' : ''}`} name="nombrePerfil" placeholder="Nombre de perfil" aria-label="Nombre de perfil"
                    value={form.nombrePerfil} onChange={onChange} minLength={2} maxLength={60} disabled={cargando}
                  />
                  <span className="campo-ayuda">Este será tu nombre de perfil.</span>
                  {errores.nombrePerfil && <span className="campo-error">{errores.nombrePerfil}</span>}
                </div>
                <div className="campo">
                  <div className="username-field">
                    <span>@</span>
                    <input
                      className={`input${errores.nombreUsuario ? ' invalido' : ''}`} name="nombreUsuario" placeholder="usuario" aria-label="Nombre de usuario único"
                      value={form.nombreUsuario} onChange={onChange} minLength={3} maxLength={30} disabled={cargando}
                    />
                  </div>
                  <span className="campo-ayuda">Este será tu @usuario y debe ser único.</span>
                  {errores.nombreUsuario && <span className="campo-error">{errores.nombreUsuario}</span>}
                </div>
              </>
            )}

            <div className="registro-actions">
              {paso > 1 && paso !== 3 && (
                <button className="btn-secundario" type="button" onClick={retroceder} disabled={cargando}>
                  {paso === 2 ? <span className="texto-suave">Correo equivocado</span> : 'Atrás'}
                </button>
              )}
              {paso < 4 ? (
                <button className="btn" type="button" onClick={siguiente} disabled={cargando || (paso === 2 && form.codigo.length < 6) || (paso === 3 && !passwordPerfecta)}>
                  {cargando ? <span className="spinner" /> : 'Continuar'}
                </button>
              ) : (
                <button className="btn" disabled={cargando}>
                  {cargando ? <span className="spinner" /> : 'Crear cuenta'}
                </button>
              )}
            </div>
          </form>

          {paso < 3 && (
            <>
              <div className="divisor" />
              <p className="pie">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
            </>
          )}
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
