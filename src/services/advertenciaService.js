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

export const advertenciaService = {
  pendientes: () => llamar(() => httpClient.get('/advertencias/pendientes')),
  marcarLeida: (idAdvertencia) => llamar(() => httpClient.post(`/advertencias/${idAdvertencia}/leer`)),
}
