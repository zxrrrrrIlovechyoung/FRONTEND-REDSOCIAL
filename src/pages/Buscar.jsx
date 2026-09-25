import { useMemo, useState } from 'react'
import AppSidebar from '../components/AppSidebar'
import MessagesWidget from '../components/MessagesWidget'

const perfiles = [
  { id: 1, nombre: 'Valeria Cruz', usuario: '@vale.cruz', avatar: 'VC', bio: 'Fotos, escuela y cafe entre clases.' },
  { id: 2, nombre: 'Mateo Rios', usuario: '@mateorios', avatar: 'MR', bio: 'Pensamientos cortos y planes largos.' },
  { id: 3, nombre: 'Camila Torres', usuario: '@cami.t', avatar: 'CT', bio: 'Guardando momentos que se sienten reales.' },
  { id: 4, nombre: 'Lucia Gomez', usuario: '@luciag', avatar: 'LG', bio: 'Cielo, musica y notas sueltas.' },
  { id: 5, nombre: 'Andres Vega', usuario: '@andresv', avatar: 'AV', bio: 'Ideas, codigo y cafe frio.' },
  { id: 6, nombre: 'Sofia Marin', usuario: '@sofia.m', avatar: 'SM', bio: 'Momentos pequenos, memoria larga.' },
]

const momentos = [
  {
    id: 1,
    tipo: 'imagen',
    autor: '@vale.cruz',
    imagen: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    texto: 'Luz bonita despues de clases.',
  },
  {
    id: 2,
    tipo: 'video',
    autor: '@grupo.5a',
    imagen: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80',
    texto: 'Proyecto terminado, por fin.',
  },
  {
    id: 3,
    tipo: 'imagen',
    autor: '@cami.t',
    imagen: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80',
    texto: 'Un recuerdo sencillo.',
  },
  {
    id: 4,
    tipo: 'imagen',
    autor: '@mateorios',
    imagen: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=900&q=80',
    texto: 'Caminar lento tambien cuenta.',
  },
  {
    id: 5,
    tipo: 'video',
    autor: '@sofia.m',
    imagen: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80',
    texto: 'Una platica que arreglo el dia.',
  },
  {
    id: 6,
    tipo: 'imagen',
    autor: '@andresv',
    imagen: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80',
    texto: 'Avanzar poquito tambien es avanzar.',
  },
]

export default function Buscar() {
  const [filtro, setFiltro] = useState('todo')
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(false)
  const [semilla, setSemilla] = useState(0)

  const buscar = (valor) => {
    setBusqueda(valor)
    setCargando(true)
    window.clearTimeout(window.__momentSearchTimer)
    window.__momentSearchTimer = window.setTimeout(() => {
      setSemilla((actual) => actual + 1)
      setCargando(false)
    }, 650)
  }

  const perfilesVisibles = useMemo(() => {
    const inicio = semilla % perfiles.length
    return [...perfiles.slice(inicio), ...perfiles.slice(0, inicio)].slice(0, 3)
  }, [semilla])

  const momentosVisibles = useMemo(() => {
    const inicio = semilla % momentos.length
    return [...momentos.slice(inicio), ...momentos.slice(0, inicio)]
  }, [semilla])

  return (
    <main className="app-shell">
      <AppSidebar activo="Buscar" />

      <section className="search-page" aria-label="Buscar">
        <header className="search-header">
          <p className="feed-kicker">Explorar Moment</p>
          <h1>Buscar</h1>
          <div className="search-box">
            <span>⌕</span>
            <input
              value={busqueda}
              onChange={(e) => buscar(e.target.value)}
              placeholder="Busca usuarios, perfiles, momentos, fotos o videos"
            />
          </div>
        </header>

        <div className="search-filters">
          {['todo', 'usuarios', 'perfiles', 'momentos', 'imagenes', 'videos'].map((item) => (
            <button className={filtro === item ? 'activo' : ''} key={item} onClick={() => setFiltro(item)}>
              {item}
            </button>
          ))}
        </div>

        <section className="search-section">
          <div className="profile-section-title">
            <h2>Perfiles sugeridos</h2>
            <span>{cargando ? 'Buscando...' : `${perfilesVisibles.length} resultados`}</span>
          </div>

          <div className="search-profiles">
            {cargando ? [1, 2, 3].map((item) => (
              <article className="search-profile-card skeleton-card" key={item}>
                <div className="skeleton avatar" />
                <div>
                  <span className="skeleton line wide" />
                  <span className="skeleton line small" />
                  <span className="skeleton line" />
                </div>
              </article>
            )) : perfilesVisibles.map((perfil) => (
              <article className="search-profile-card" key={perfil.id}>
                <div className="profile-avatar">{perfil.avatar}</div>
                <div>
                  <strong>{perfil.nombre}</strong>
                  <span>{perfil.usuario}</span>
                  <p>{perfil.bio}</p>
                </div>
                <button>Ver</button>
              </article>
            ))}
          </div>
        </section>

        <section className="search-section">
          <div className="profile-section-title">
            <h2>Momentos encontrados</h2>
            <span>{cargando ? 'Cargando momentos' : `${momentosVisibles.length} publicaciones`}</span>
          </div>

          <div className="search-grid">
            {cargando ? [1, 2, 3, 4, 5, 6].map((item) => (
              <article className="search-moment skeleton-moment" key={item}>
                <span className="skeleton-fill" />
              </article>
            )) : momentosVisibles.map((momento) => (
              <article className="search-moment" key={momento.id}>
                <img src={momento.imagen} alt={momento.texto} />
                {momento.tipo === 'video' && <span className="media-type">▷</span>}
                <div>
                  <strong>{momento.autor}</strong>
                  <p>{momento.texto}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>

      <MessagesWidget />
    </main>
  )
}
