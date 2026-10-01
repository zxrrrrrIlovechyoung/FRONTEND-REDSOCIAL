export const rutaInicialPorRol = (rol = 'usuario') => {
  const normalizado = String(rol).toLowerCase()
  if (normalizado === 'admin') return '/admin'
  if (normalizado === 'moderador') return '/moderador'
  return '/inicio'
}
