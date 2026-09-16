import axios from 'axios'
import { tokenStorage } from '../utils/tokenStorage'

const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5079/api',
  headers: { 'Content-Type': 'application/json' },
})

// Adjunta el JWT a cada petición.
httpClient.interceptors.request.use((config) => {
  const token = tokenStorage.obtener()
  if (token) config.headers.Authorization = `Bearer ${token}`
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
