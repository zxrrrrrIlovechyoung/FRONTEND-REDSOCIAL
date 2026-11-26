import axios from 'axios'
import { csrf } from './csrf'
import { tokenStorage } from '../utils/tokenStorage'

const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5079/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// Adjunta el JWT legado y el token CSRF a las peticiones mutables.
httpClient.interceptors.request.use((config) => {
  const token = tokenStorage.obtener()
  if (token) config.headers.Authorization = `Bearer ${token}`

  const metodo = String(config.method ?? 'get').toUpperCase()
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(metodo)) {
    const csrfToken = csrf.obtener()
    if (csrfToken) config.headers['X-CSRF-TOKEN'] = csrfToken
  }

  return config
})

// Si el token expiró o es inválido, cerramos sesión.
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && tokenStorage.obtener()) {
      tokenStorage.limpiar()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default httpClient
