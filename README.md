# RedSocial — Frontend

React + Vite. Consume la API de `REDSOCIAL/BACKEND`.

## Estructura

```
src/
├── api/httpClient.js        Axios con interceptores (adjunta JWT, maneja 401)
├── services/authService.js  Llamadas a /auth
├── context/AuthContext.jsx  Estado global de sesión
├── routes/RutaProtegida.jsx Redirige a /login si no hay sesión
├── utils/tokenStorage.js    Guarda el token en sessionStorage
└── pages/                   Login, Registro, Inicio
```

## Cómo correrlo

```bash
cp .env.example .env
```

```bash
npm install
```

```bash
npm run dev
```

La URL del backend se configura en `VITE_API_URL`. El origen del front debe estar en `Cors:Origenes` del backend.

> Nota de seguridad: la validación de contraseña en el front es solo UX; la validación real la hace el backend.
