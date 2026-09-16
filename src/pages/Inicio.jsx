import { useAuth } from '../context/AuthContext'

export default function Inicio() {
  const { logout } = useAuth()

  return (
    <main className="auth">
      <div className="card">
        <h1 className="card-titulo">Hello World</h1>
        <button className="btn" onClick={logout}>Cerrar sesión</button>
      </div>
    </main>
  )
}
