# Futbot - San Marino Famaf (Frontend)

Este repositorio contiene el frontend del juego Futbot, desarrollado con React, Vite y Tailwind CSS siguiendo una arquitectura orientada a características (Feature-Sliced Design).

## Requisitos previos
- **Node.js** (v18 o superior recomendado)
- **npm** (incluido en Node.js)

## Inicialización del proyecto

Tras clonar el [repositorio](https://github.com/ids1-2026-sanmarinofamaf/Front-FutBot):

1. **Configuración del entorno**

Antes de correr el proyecto, creá un archivo `.env` en la raíz del frontend con las variables:
* `VITE_API_URL`: URL de API (Backend del proyecto)
* `VITE_WS_SESSION_URL`: URL para conexión websocket de sesión

A modo de ejemplo:
```env
VITE_API_URL=http://127.0.0.1:8000
VITE_WS_SESSION_URL=ws://127.0.0.1:8000
```

Estas variables dependen de cada entorno (desarrollo, producción, etc.), por eso el `.env` **no está incluido en el repositorio**. Ajustá las URLs según dónde esté corriendo el backend.

### Sobre la raiz del repositorio ejecutar el siguiente comandos

2. **Instalar las dependencias:**

```bash
npm install
```

3. **Iniciar el servidor de desarrollo:**
```bash
npm run dev
```

4. **Abrir la aplicación**

El terminal mostrará una URL local (generalmente `http://localhost:5173/`). Abre ese enlace en tu navegador.

## Test

Para ejecutar todos los test ejecute sobre la raiz del repositorio:

```bash
npm test
```
Si quiere ejecutar un archivo de test particular ejecute: 

```bash
npm test -- nombreDeArchivo.test.js/jsx
```