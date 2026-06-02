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



## Ejecutar con Docker (recomendado)



Requisito: [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y en ejecucion.



Desde la raiz del proyecto:



```powershell

docker compose up --build

```



La primera vez construye las imagenes, crea PostgreSQL, carga schema/seed, sincroniza Django y deja las contrasenas seed en `123456`.



URLs:

- Frontend: http://127.0.0.1:5175

- API backend (directa): http://127.0.0.1:8001/api/

- PostgreSQL (opcional, desde el host): `127.0.0.1:5433` usuario `postgres`, password `diego`



Usuarios seed (todos con password `123456`):

- `smartinez` (Administrador)

- `dalvarez` (Vendedor)

- `vtorres` (Bodeguero)

- `rparedes` (Compras)

- `alucero` (Auditor)



### Comandos utiles de Docker



```powershell

# Levantar en segundo plano

docker compose up --build -d



# Ver logs

docker compose logs -f



# Detener servicios

docker compose down



# Reiniciar base de datos desde cero (borra datos locales)

docker compose down -v

docker compose up --build

```



**Nota:** Docker usa los puertos `5175` (frontend) y `8001` (API directa) en el host para no chocar con otros servicios locales. El frontend habla con el backend por la red interna de Docker; abrir http://127.0.0.1:5175 es suficiente para usar la app.



El frontend dentro de Docker usa la variable `VITE_PROXY_TARGET=http://backend:8000` para enviar `/api` al backend. En desarrollo sin Docker sigue apuntando a `http://127.0.0.1:8000` ([frontend/vite.config.js](frontend/vite.config.js)).



---



## Setup manual (sin Docker)



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



El schema SQL ya crea todas las tablas, asi que se marcan las migraciones como

aplicadas sin volver a ejecutarlas:



```powershell

backend\.venv\Scripts\python.exe backend\manage.py migrate --fake

```



### 4. Resetear contrasenas de los usuarios seed a `123456`



```powershell

backend\.venv\Scripts\python.exe backend\scripts\reset_passwords_and_list_users.py

```



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



## Despliegue a produccion



Ver [DEPLOY.md](DEPLOY.md) (Google Cloud Run + Firebase Hosting).


