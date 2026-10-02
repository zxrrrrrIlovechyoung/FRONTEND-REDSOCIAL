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
  dashboard: ({ paginaCuentas = 1, paginaReportes = 1, paginaObservacion = 1 } = {}) => llamar(() => httpClient.get('/moderacion/dashboard', {
    params: { paginaCuentas, paginaReportes, paginaObservacion },
  })),
  accionUsuario: (idUsuario, datos) => llamar(() => httpClient.post(`/moderacion/usuarios/${idUsuario}/accion`, datos)),
}
