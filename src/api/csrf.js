let token = ''

export const csrf = {
  obtener: () => token,
  guardar: (nuevoToken) => {
    token = nuevoToken || ''
    return token
  },
  limpiar: () => {
    token = ''
  },
}
