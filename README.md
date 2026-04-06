# SISTEMA_DE_INFORMACION_I/2026

Proyecto organizado por capas:

- backend: Django + DRF + PostgreSQL
- frontend: React (Vite) + TailwindCSS

## Estructura

- [backend](backend)
	- [backend/manage.py](backend/manage.py)
	- [backend/config](backend/config)
	- [backend/catalogos](backend/catalogos)
	- [backend/db](backend/db)
- [frontend](frontend)
	- [frontend/package.json](frontend/package.json)
	- [frontend/App.jsx](frontend/App.jsx)
	- [frontend/main.jsx](frontend/main.jsx)

## Ejecutar backend (Django)

1. Abrir terminal en la carpeta raiz del proyecto.
2. Ejecutar:

```powershell
$env:POSTGRES_PASSWORD="diego"
& "c:/Users/diego/Desktop/Sistemas de Informacion/PROGRAMAS/SISTEMA_DE_INFORMACION_I/2026/.venv/Scripts/python.exe" backend/manage.py runserver 127.0.0.1:8000
```

## Ejecutar frontend (Vite)

1. Abrir una segunda terminal.
2. Ejecutar:

```powershell
cd frontend
npm run dev
```

Frontend local:

- http://127.0.0.1:5173

API backend:

- http://127.0.0.1:8000/api/

Nota:

- El frontend usa proxy de Vite para enviar /api al backend, por eso los componentes React usan rutas relativas.
