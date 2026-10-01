import { Link } from 'react-router-dom'

export default function RecuperarPassword() {
  return (
    <main className="auth">
      <div className="card">
        <div className="auth-brand">
          <span className="brand-mark">M</span>
          <strong>Moment</strong>
        </div>

        <h1 className="card-titulo">Recuperar contraseña</h1>
        <p className="card-sub">Pronto podrás recuperar el acceso con tu correo verificado.</p>

        <div className="empty-state-mini">
          <strong>Función en preparación</strong>
          <span>Este será el siguiente flujo de seguridad.</span>
        </div>

        <div className="divisor" />
        <p className="pie"><Link to="/login">Volver al login</Link></p>
      </div>
    </main>
  )
}
