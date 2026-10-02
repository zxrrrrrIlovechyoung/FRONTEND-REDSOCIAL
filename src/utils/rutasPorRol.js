export const rutaInicialPorRol = (rol = 'usuario') => {
  const normalizado = String(rol).toLowerCase()
  if (normalizado === 'admin') return '/admin'
  if (normalizado === 'moderador') return '/moderador'
  return '/inicio'
}

export const necesitaSelectorDeEntrada = (usuario) => {
  const roles = usuario?.roles ?? []
  return Array.isArray(roles) && roles.length > 1 && !usuario?.rolActivo
}
