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

export const momentoService = {
  feed: () => llamar(() => httpClient.get('/momentos')),
  feedPublico: () => llamar(() => httpClient.get('/momentos/publico')),
  misMomentos: ({ cursor, cantidad = 30 } = {}) => llamar(() => httpClient.get('/momentos/me', {
    params: { cursor, cantidad },
  })),
  favoritos: () => llamar(() => httpClient.get('/momentos/favoritos')),
  momentosDeUsuario: (idUsuario, { cursor, cantidad = 30 } = {}) => llamar(() => httpClient.get(`/momentos/usuario/${idUsuario}`, {
    params: { cursor, cantidad },
  })),
  alternarMeGusta: (idMomento) => llamar(() => httpClient.post(`/momentos/${idMomento}/me-encanta`)),
  eliminar: (idMomento) => llamar(() => httpClient.delete(`/momentos/${idMomento}`)),
  comentarios: (idMomento, { cursor, cantidad = 20, padre } = {}) => llamar(() => httpClient.get(`/momentos/${idMomento}/comentarios`, {
    params: { cursor, cantidad, padre },
  })),
  crearComentario: (idMomento, texto, idComentarioPadre = null) => llamar(() => httpClient.post(`/momentos/${idMomento}/comentarios`, { texto, idComentarioPadre })),
  alternarMeGustaComentario: (idComentario) => llamar(() => httpClient.post(`/momentos/comentarios/${idComentario}/me-encanta`)),
  crear: ({ texto, tipoAdjunto, archivos, linkUrl }) => {
    const formData = new FormData()
    formData.append('texto', texto)
    if (tipoAdjunto) formData.append('tipoAdjunto', tipoAdjunto)
    ;(archivos ?? []).forEach((archivo) => formData.append('archivos', archivo))
    if (linkUrl) formData.append('linkUrl', linkUrl)

    return llamar(() => httpClient.post('/momentos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }))
  },
}
