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

## Setup inicial (primera vez en una maquina nueva)

### 1. Crear venv del backend e instalar dependencias

```powershell
& "C:\Users\diego\AppData\Local\Python\pythoncore-3.14-64\python.exe" -m venv backend\.venv
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

### 2. Crear y poblar la base de datos

Importante: hay que `cd` a `backend\db` antes de correr `00_run_all.psql`, porque
el script usa `\i 01_create_database.sql` con ruta relativa.

```powershell
$env:PGPASSWORD = 'diego'
cd backend\db
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -U postgres -h 127.0.0.1 -d postgres -f 00_run_all.psql
cd ..\..
```

### 3. Sincronizar Django con el schema (solo la primera vez)

El schema SQL ya cre todas las tablas, asi que se marcan las migraciones como
aplicadas sin volver a ejecutarlas:

```powershell
backend\.venv\Scripts\python.exe backend\manage.py migrate --fake
```

### 4. Resetear contrase&ntilde;as de los usuarios seed a `123456`

```powershell
backend\.venv\Scripts\python.exe backend\scripts\reset_passwords_and_list_users.py
```

Usuarios seed (todos con password `123456`):
- `smartinez` (Administrador)
- `dalvarez` (Vendedor)
- `vtorres` (Bodeguero)
- `rparedes` (Compras)
- `alucero` (Auditor)

### 5. Si npm en PowerShell falla por ExecutionPolicy

PowerShell por defecto bloquea `npm.ps1`. Hay dos opciones:

**Opcion A** (recomendada, una sola vez por usuario):

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

**Opcion B** (sin tocar la politica): usar `npm.cmd` en vez de `npm`:

```powershell
cd frontend
npm.cmd run dev
```

## Ejecutar backend (Django)

```powershell
backend\.venv\Scripts\python.exe backend\manage.py runserver 127.0.0.1:8000
```

## Ejecutar frontend (Vite)

```powershell
cd frontend
npm run dev
```

URLs:
- Frontend: http://127.0.0.1:5173
- API backend: http://127.0.0.1:8000/api/

El frontend usa proxy de Vite para enviar `/api` al backend (configurado en
[frontend/vite.config.js](frontend/vite.config.js)), por eso los componentes
React usan rutas relativas como `/api/proveedores/`.
