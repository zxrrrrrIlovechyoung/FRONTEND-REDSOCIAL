import httpClient from '../api/httpClient'

const mensajeDeError = (error) => {
  const data = error.response?.data
  if (data?.mensaje) return data.mensaje
  if (data?.errors) return Object.values(data.errors).flat().join(' ')
  return 'Ups, algo salió mal. Inténtalo más tarde'
}

const llamar = async (peticion) => {
  try {
    const { data } = await peticion()
    return data
  } catch (error) {
    return { exito: false, mensaje: mensajeDeError(error) }
  }
}

export const perfilService = {
  publico: (nombreUsuario) => llamar(() => httpClient.get(`/perfil/${encodeURIComponent(nombreUsuario)}`)),
  alternarSeguimiento: (idUsuario) => llamar(() => httpClient.post(`/perfil/${idUsuario}/seguimiento`)),
}
