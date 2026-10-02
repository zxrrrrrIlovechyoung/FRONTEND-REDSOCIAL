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

export const adminService = {
  dashboard: () => llamar(() => httpClient.get('/admin/dashboard')),
  usuarios: ({ pagina = 1, q = '' } = {}) => llamar(() => httpClient.get('/admin/usuarios', {
    params: { pagina, q },
  })),
  accionUsuario: (idUsuario, datos) => llamar(() => httpClient.post(`/admin/usuarios/${idUsuario}/accion`, datos)),
}
