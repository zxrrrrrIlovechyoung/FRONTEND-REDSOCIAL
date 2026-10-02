import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import RutaProtegida from './routes/RutaProtegida'
import RutaPorRol from './routes/RutaPorRol'
import Login from './pages/Login'
import Registro from './pages/Registro'
import RecuperarPassword from './pages/RecuperarPassword'
import InicioPublico from './pages/InicioPublico'
import Inicio from './pages/Inicio'
import Perfil from './pages/Perfil'
import PerfilPublico from './pages/PerfilPublico'
import EditarPerfil from './pages/EditarPerfil'
import Mensajes from './pages/Mensajes'
import Favoritos from './pages/Favoritos'
import Configuracion from './pages/Configuracion'
import Buscar from './pages/Buscar'
import Moderador from './pages/Moderador'
import Admin from './pages/Admin'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<InicioPublico />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/recuperar-password" element={<RecuperarPassword />} />
          <Route element={<RutaProtegida />}>
            <Route path="/inicio" element={<Inicio />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/perfil/editar" element={<EditarPerfil />} />
            <Route path="/perfil/:nombreUsuario" element={<PerfilPublico />} />
            <Route path="/mensajes" element={<Mensajes />} />
            <Route path="/favoritos" element={<Favoritos />} />
            <Route path="/configuracion" element={<Configuracion />} />
            <Route path="/buscar" element={<Buscar />} />
          </Route>
          <Route element={<RutaPorRol rolesPermitidos={['moderador', 'admin']} />}>
            <Route path="/moderador" element={<Moderador />} />
          </Route>
          <Route element={<RutaPorRol rolesPermitidos={['admin']} />}>
            <Route path="/admin" element={<Admin />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
