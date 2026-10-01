import { useEffect, useState } from 'react'
import AppSidebar from '../components/AppSidebar'
import MessagesWidget from '../components/MessagesWidget'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import { authService } from '../services/authService'

export default function Perfil() {
  const { usuario } = useAuth()
  const [perfil, setPerfil] = useState(null)
  const nombre = usuario?.nombreUsuario || usuario?.usuario || 'Raul'
  const usuarioPerfil = `@${String(perfil?.nombreUsuario || nombre).toLowerCase()}`

  useEffect(() => {
    let activo = true
    authService.miPerfil().then((resultado) => {
      if (activo && resultado.exito) setPerfil(resultado.datos)
    })
    return () => { activo = false }
  }, [])

  return (
    <main className="app-shell">
      <AppSidebar activo="Perfil" />

      <section className="profile-page" aria-label="Mi perfil">
        <header className="profile-hero">
          <div className="profile-main">
            <div className="profile-photo">{nombre.slice(0, 2).toUpperCase()}</div>
            <div className="profile-info">
              <p className="feed-kicker">Mi perfil</p>
              <div className="profile-title-row">
                <div className="profile-name-line">
                  <h1>{perfil?.nombrePerfil || nombre}</h1>
                  <Link className="settings-btn" to="/configuracion" aria-label="Configuracion del perfil">⚙</Link>
                </div>
                <span>{usuarioPerfil}</span>
              </div>

              <div className="profile-stats" aria-label="Estadisticas del perfil">
                <div>
                  <strong>{(perfil?.seguidores ?? 0).toLocaleString('es-MX')}</strong>
                  <span>Seguidores</span>
                </div>
                <div>
                  <strong>{(perfil?.seguidos ?? 0).toLocaleString('es-MX')}</strong>
                  <span>Seguidos</span>
                </div>
                <div>
                  <strong>{(perfil?.totalMeEncanta ?? 0).toLocaleString('es-MX')}</strong>
                  <span>Me encanta</span>
                </div>
              </div>
              <p>{perfil?.sobreMi || 'Compartiendo momentos, pensamientos y pequenas escenas de la vida escolar.'}</p>
              <div className="profile-actions">
                <button className="profile-btn primary">Editar perfil</button>
                <button className="profile-btn">Compartir perfil</button>
              </div>
            </div>
          </div>
        </header>

        <div className="profile-section-title">
          <h2>Momentos compartidos</h2>
          <span>0 publicaciones</span>
        </div>

        <section className="profile-empty-moments">
          <h3>Aún no has compartido momentos</h3>
          <p>Cuando publiques algo, aparecerá aquí ligado a tu perfil.</p>
        </section>
      </section>

      <MessagesWidget />
    </main>
  )
}
