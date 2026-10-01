import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CampoPassword from '../components/CampoPassword'
import { useAuth } from '../context/AuthContext'

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
const dominiosEmail = ['gmail.com', 'hotmail.com']

export default function RecuperarPassword() {
  const { solicitarRecuperacionPassword, verificarRecuperacionPassword, cambiarPassword } = useAuth()
  const navigate = useNavigate()
  const codigoRefs = useRef([])
  const [paso, setPaso] = useState(1)
  const [form, setForm] = useState({ email: '', codigo: '', password: '', confirmar: '' })
  const [recoveryToken, setRecoveryToken] = useState('')
  const [estadoCodigo, setEstadoCodigo] = useState('idle')
  const [errores, setErrores] = useState({})
  const [cargando, setCargando] = useState(false)
  const [completado, setCompletado] = useState(false)

  const passwordCumple = reglasPassword.every((regla) => regla.valida(form.password))
  const noCoinciden = form.confirmar !== '' && form.password !== form.confirmar
  const passwordLista = passwordCumple && form.confirmar !== '' && form.password === form.confirmar
  const nivelPassword = form.password ? Math.max(1, reglasFuerzaPassword.filter((regla) => regla(form.password)).length) : 0
  const textoNivelPassword = ['', 'Muy débil', 'Débil', 'Media', 'Buena', 'Segura'][nivelPassword]
  const bloquearPortapapeles = (e) => e.preventDefault()

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrores(({ [e.target.name]: _, general: __, ...resto }) => resto)
  }

  const alternarDominioEmail = (e) => {
    if (e.key !== 'Enter') return
    if (form.email.includes('.') && form.email.includes('@')) return
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
    setErrores(({ codigo: _, general: __, ...resto }) => resto)
    if (digito && index < 5) codigoRefs.current[index + 1]?.focus()
    if (digito && index === 5 && codigo.length === 6) verificarCodigo(codigo)
  }

  const manejarTeclaCodigo = (e, index) => {
    if (e.key === 'Backspace' && !form.codigo[index] && index > 0) codigoRefs.current[index - 1]?.focus()
  }

  const pegarCodigo = (e) => {
    e.preventDefault()
    const codigo = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!codigo) return
    setForm({ ...form, codigo })
    setEstadoCodigo('idle')
    setErrores(({ codigo: _, general: __, ...resto }) => resto)
    codigoRefs.current[Math.min(codigo.length, 5)]?.focus()
    if (codigo.length === 6) verificarCodigo(codigo)
  }

  const solicitarCodigo = async () => {
    const email = form.email.trim()
    if (!email) return setErrores({ email: 'El correo es obligatorio' })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setErrores({ email: 'Ingresa un correo válido' })
    setCargando(true)
    const resultado = await solicitarRecuperacionPassword(email)
    setCargando(false)
    if (!resultado.exito) return setErrores({ email: resultado.mensaje })
    setPaso(2)
  }

  const verificarCodigo = async (codigoActual = form.codigo) => {
    if (!/^\d{6}$/.test(codigoActual.trim()) || cargando) return
    setEstadoCodigo('validando')
    setCargando(true)
    const resultado = await verificarRecuperacionPassword(form.email.trim(), codigoActual.trim())
    setCargando(false)
    if (!resultado.exito) {
      setEstadoCodigo('error')
      setErrores({ codigo: resultado.mensaje })
      return
    }
    setEstadoCodigo('exito')
    setRecoveryToken(resultado.datos?.recoveryToken || '')
    window.setTimeout(() => setPaso(3), 950)
  }

  const guardarPassword = async (e) => {
    e.preventDefault()
    if (!passwordLista) return setErrores({ confirmar: 'La contraseña debe cumplir las reglas y coincidir' })
    setCargando(true)
    const resultado = await cambiarPassword(form.email.trim(), recoveryToken, form.password)
    setCargando(false)
    if (!resultado.exito) return setErrores({ confirmar: resultado.mensaje })
    setCompletado(true)
    window.setTimeout(() => navigate('/login', { replace: true }), 1700)
  }

  return (
    <main className="auth">
      {!completado && (
        <div className="card">
          <div className="auth-brand"><span className="brand-mark">M</span><strong>Moment</strong></div>
          <div className="steps recuperar-steps">{[1, 2, 3].map((item) => <span className={paso >= item ? 'activo' : ''} key={item} />)}</div>
          <h1 className="card-titulo">Recuperar contraseña</h1>
          <p className="card-sub">
            {paso === 1 && 'Confirma el correo de tu cuenta.'}
            {paso === 2 && 'Ingresa el código que enviamos a tu correo.'}
            {paso === 3 && 'Crea una contraseña nueva y segura.'}
          </p>

          {paso === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); solicitarCodigo() }} noValidate>
              <div className="campo">
                <input className={`input${errores.email ? ' invalido' : ''}`} name="email" type="email" placeholder="Correo electrónico" aria-label="Correo electrónico" value={form.email} onChange={onChange} onKeyDown={alternarDominioEmail} autoComplete="email" maxLength={100} disabled={cargando} />
                {errores.email && <span className="campo-error">{errores.email}</span>}
              </div>
              <button className="btn" disabled={cargando}>{cargando ? <span className="spinner" /> : 'Enviar código'}</button>
            </form>
          )}

          {paso === 2 && (
            <form onSubmit={(e) => { e.preventDefault(); verificarCodigo() }} noValidate>
              <div className={`campo codigo-campo codigo-${estadoCodigo}`}>
                <div className="codigo-grid" onPaste={pegarCodigo}>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <input key={index} ref={(elemento) => { codigoRefs.current[index] = elemento }} className="codigo-box" style={{ '--delay': `${index * 55}ms` }} inputMode="numeric" pattern="[0-9]*" aria-label={`Dígito ${index + 1} del código`} value={form.codigo[index] || ''} onChange={(e) => actualizarCodigo(e.target.value, index)} onKeyDown={(e) => manejarTeclaCodigo(e, index)} disabled={cargando || estadoCodigo === 'exito'} maxLength={1} />
                  ))}
                </div>
                {estadoCodigo === 'validando' && <span className="codigo-status"><span className="spinner oscuro" /> Validando código</span>}
                {errores.codigo && <span className="campo-error">{errores.codigo}</span>}
                <span className="campo-ayuda">Ingresa solo los 6 números del correo.</span>
              </div>
              <div className="registro-actions">
                <button className="btn-secundario" type="button" onClick={() => setPaso(1)} disabled={cargando}>
                  <span className="texto-suave">Cambiar correo</span>
                </button>
                <button className="btn" disabled={cargando || form.codigo.length < 6}>{cargando ? <span className="spinner" /> : 'Continuar'}</button>
              </div>
            </form>
          )}

          {paso === 3 && (
            <form onSubmit={guardarPassword} noValidate>
              <div className="campo">
                <CampoPassword invalido={Boolean(errores.password)} name="password" placeholder="Nueva contraseña" aria-label="Nueva contraseña" value={form.password} onChange={onChange} autoComplete="new-password" maxLength={72} disabled={cargando} onCopy={bloquearPortapapeles} onCut={bloquearPortapapeles} onPaste={bloquearPortapapeles} />
                {errores.password && <span className="campo-error">{errores.password}</span>}
              </div>
              <div className="campo">
                <CampoPassword invalido={noCoinciden || Boolean(errores.confirmar)} name="confirmar" placeholder="Confirmar contraseña" aria-label="Confirmar contraseña" value={form.confirmar} onChange={onChange} autoComplete="new-password" maxLength={72} disabled={cargando} onCopy={bloquearPortapapeles} onCut={bloquearPortapapeles} onPaste={bloquearPortapapeles} />
                {(noCoinciden || errores.confirmar) && <span className="campo-error">{errores.confirmar || 'Las contraseñas no coinciden'}</span>}
                <div className={`password-meter nivel-${nivelPassword}`} aria-live="polite">
                  {Array.from({ length: 5 }).map((_, index) => <span key={index} />)}
                  {textoNivelPassword && <strong>{textoNivelPassword}</strong>}
                </div>
                <ul className="password-rules" aria-label="Reglas de contraseña">
                  {reglasPassword.map((regla) => <li className={regla.valida(form.password) ? 'cumple' : ''} key={regla.id}>{regla.texto}</li>)}
                </ul>
              </div>
              <button className="btn" disabled={cargando || !passwordLista}>{cargando ? <span className="spinner" /> : 'Guardar contraseña'}</button>
            </form>
          )}

          <div className="divisor" />
          <p className="pie"><Link to="/login">Volver al login</Link></p>
        </div>
      )}

      {completado && (
        <button className="success-pop" onClick={() => navigate('/login', { replace: true })}>
          <span>➜</span>
          <strong>Contraseña actualizada</strong>
          <small>Te llevaremos al login en un momento</small>
        </button>
      )}
    </main>
  )
}
