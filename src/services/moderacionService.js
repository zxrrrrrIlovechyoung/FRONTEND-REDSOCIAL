import httpClient from '../api/httpClient'

const mensajeDeError = (error) => error.response?.data?.mensaje || 'Ups, algo salió mal. Inténtalo más tarde'

const llamar = async (peticion) => {
  try {
    const { data } = await peticion()
    return data
  } catch (error) {
    return { exito: false, mensaje: mensajeDeError(error) }
  }
}

export const moderacionService = {
  dashboard: () => llamar(() => httpClient.get('/moderacion/dashboard')),
  accionUsuario: (idUsuario, datos) => llamar(() => httpClient.post(`/moderacion/usuarios/${idUsuario}/accion`, datos)),
}
