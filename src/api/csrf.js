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
    // Todas las peticiones comparten la misma renovación. Esto evita que dos
    // reintentos simultáneos sobrescriban la cookie y el token en distinto orden.
    if (cargaPendiente) return cargaPendiente
    if (token && !forzar) return token

    if (forzar) token = ''

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
