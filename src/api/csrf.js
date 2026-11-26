import axios from 'axios'

const clienteCsrf = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5079/api',
  withCredentials: true,
})

let token = ''
let cargaPendiente = null

export const csrf = {
  obtener: () => token,
  guardar: (nuevoToken) => {
    token = nuevoToken || ''
    return token
  },
  cargar: async (forzar = false) => {
    if (token && !forzar) return token
    if (cargaPendiente && !forzar) return cargaPendiente

    cargaPendiente = clienteCsrf.get('/auth/csrf', { timeout: 10000 })
      .then(({ data }) => csrf.guardar(data?.datos?.token))
      .catch(() => '')
      .finally(() => { cargaPendiente = null })

    return cargaPendiente
  },
  limpiar: () => {
    token = ''
  },
}
