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

export const chatService = {
  contactos: () => llamar(() => httpClient.get('/chat/contactos')),
  conversaciones: () => llamar(() => httpClient.get('/chat/conversaciones')),
  noLeidos: () => llamar(() => httpClient.get('/chat/no-leidos')),
  abrir: (idUsuario) => llamar(() => httpClient.post(`/chat/conversaciones/${idUsuario}`)),
  mensajes: (hash) => llamar(() => httpClient.get(`/chat/conversaciones/${hash}/mensajes`)),
  marcarLeidos: (hash) => llamar(() => httpClient.post(`/chat/conversaciones/${hash}/leer`)),
}
