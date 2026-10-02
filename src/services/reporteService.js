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

export const reporteService = {
  perfil: ({ idUsuario, motivo, detalle }) => llamar(() => httpClient.post('/reportes/perfil', { idUsuario, motivo, detalle })),
  momento: ({ idMomento, motivo, detalle }) => llamar(() => httpClient.post('/reportes/momento', { idMomento, motivo, detalle })),
}
