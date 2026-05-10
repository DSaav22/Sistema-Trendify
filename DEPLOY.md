# Despliegue a producción — Trendify

Backend en **Google Cloud Run** + **Cloud SQL Postgres** · Frontend en **Firebase Hosting**.

> **Estado:** Fase 1 (preparación de código) y Fase 4.1 (URLs del frontend) ya están aplicadas. Las fases 0, 2, 3, 4.2-4.3 y 5 requieren `gcloud` SDK (no instalado todavía). Esta guía documenta los comandos exactos para correr cuando lo tengas.

---

## Variables que vas a usar (anotalas a medida que avanzas)

| Variable | Ejemplo / cómo obtenerla |
|---|---|
| `PROJECT_ID` | de `gcloud init`, ej. `trendify-uagrm-2026` |
| `REGION` | sugerido `southamerica-east1` (São Paulo) |
| `INSTANCE_NAME` | sugerido `trendify-db` |
| `INSTANCE_CONN_NAME` | `PROJECT_ID:REGION:INSTANCE_NAME` |
| `DB_PASSWORD` | password fuerte para usuario `trendify` (vos lo generás) |
| `SECRET_KEY` | `python -c "import secrets; print(secrets.token_urlsafe(50))"` |
| `BACKEND_URL` | la imprime `gcloud run deploy`, ej. `https://trendify-backend-xxxx-rj.a.run.app` |
| `FIREBASE_PROJECT_ID` | de https://console.firebase.google.com |
| `FIREBASE_URL` | `https://FIREBASE_PROJECT_ID.web.app` |

---

## Fase 0 — Setup (una sola vez)

### 0.1 Instalar gcloud SDK
Bajar de https://cloud.google.com/sdk/docs/install (Windows installer). Reiniciar PowerShell.

```powershell
gcloud version
gcloud init    # login + crear/elegir proyecto
```

### 0.2 Habilitar billing y APIs
1. Habilitar **billing** en https://console.cloud.google.com/billing (necesita tarjeta — el uso para defensa cabe en free tier).
2. Habilitar APIs:
   ```powershell
   gcloud services enable run.googleapis.com sqladmin.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com
   ```

### 0.3 Crear proyecto Firebase
- Ir a https://console.firebase.google.com → "Agregar proyecto" → seleccionar el mismo `PROJECT_ID` de GCP (los puede vincular automáticamente). Anotar `FIREBASE_PROJECT_ID`.

---

## Fase 2 — Cloud SQL Postgres

### 2.1 Crear instancia, BD y usuario
```powershell
gcloud sql instances create trendify-db `
    --database-version=POSTGRES_15 `
    --region=southamerica-east1 `
    --tier=db-f1-micro `
    --root-password=<RootPassFuerte>

gcloud sql databases create cosmetica_sistema --instance=trendify-db
gcloud sql users create trendify --instance=trendify-db --password=<DB_PASSWORD>
```

### 2.2 Cargar schema y seed (vía Cloud SQL Auth Proxy)

1. Bajar `cloud-sql-proxy.exe` de https://cloud.google.com/sql/docs/postgres/sql-proxy y ponerlo en `C:\Users\diego\bin\` (o donde prefieras).

2. En una terminal, mantener el proxy corriendo:
   ```powershell
   .\cloud-sql-proxy.exe PROJECT_ID:southamerica-east1:trendify-db
   ```

3. En otra terminal, aplicar schema:
   ```powershell
   $env:PGPASSWORD = '<DB_PASSWORD>'
   cd c:\Users\diego\Documents\GitHub\2026\backend\db
   $psql = 'C:\Program Files\PostgreSQL\18\bin\psql.exe'
   & $psql -U trendify -h 127.0.0.1 -d cosmetica_sistema -f 02_schema.sql
   & $psql -U trendify -h 127.0.0.1 -d cosmetica_sistema -f 03_seed.sql
   & $psql -U trendify -h 127.0.0.1 -d cosmetica_sistema -f 05_migracion_rol_cliente.sql
   ```

4. Resetear passwords del seed apuntando al proxy:
   ```powershell
   $env:DATABASE_URL = "postgres://trendify:$env:PGPASSWORD@127.0.0.1:5432/cosmetica_sistema"
   cd c:\Users\diego\Documents\GitHub\2026\backend
   .\.venv\Scripts\python.exe scripts\reset_passwords_and_list_users.py
   ```

5. Marcar las migraciones de Django como aplicadas (porque las tablas ya las creó el SQL):
   ```powershell
   .\.venv\Scripts\python.exe manage.py migrate --fake
   ```

6. Detener el proxy (Ctrl+C en su terminal).

---

## Fase 3 — Deploy del backend en Cloud Run

### 3.1 Crear secrets en Secret Manager

```powershell
# 1) Generar SECRET_KEY (ejecutar y copiar el output)
.\.venv\Scripts\python.exe -c "import secrets; print(secrets.token_urlsafe(50))"

# 2) Subir secrets (reemplazar placeholders)
"PEGAR_SECRET_KEY" | gcloud secrets create django-secret --data-file=-

"postgres://trendify:<DB_PASSWORD>@/cosmetica_sistema?host=/cloudsql/PROJECT_ID:southamerica-east1:trendify-db" | `
  gcloud secrets create db-url --data-file=-

"https://FIREBASE_PROJECT_ID.web.app,https://FIREBASE_PROJECT_ID.firebaseapp.com" | `
  gcloud secrets create cors-origins --data-file=-
```

### 3.2 Dar al service account de Cloud Run permiso para leer secrets

```powershell
$PROJECT_NUMBER = gcloud projects describe PROJECT_ID --format="value(projectNumber)"
gcloud projects add-iam-policy-binding PROJECT_ID `
  --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" `
  --role="roles/secretmanager.secretAccessor"
```

### 3.3 Deploy

```powershell
cd c:\Users\diego\Documents\GitHub\2026\backend
gcloud run deploy trendify-backend `
    --source . `
    --region=southamerica-east1 `
    --platform=managed `
    --allow-unauthenticated `
    --add-cloudsql-instances=PROJECT_ID:southamerica-east1:trendify-db `
    --set-env-vars="DEBUG=False,ALLOWED_HOSTS=*.run.app" `
    --set-secrets="SECRET_KEY=django-secret:latest,DATABASE_URL=db-url:latest,CORS_ALLOWED_ORIGINS=cors-origins:latest,CSRF_TRUSTED_ORIGINS=cors-origins:latest"
```

Cloud Build subirá la imagen y al terminar imprime la URL pública:
```
Service URL: https://trendify-backend-xxxxxxxx-rj.a.run.app
```

**Anotar esa URL** — se llama `BACKEND_URL` en el resto de los pasos.

### 3.4 Smoke test del backend

```powershell
curl https://trendify-backend-xxxxxxxx-rj.a.run.app/api/auth/login/ `
  -X POST -H "Content-Type: application/json" `
  -d '{\"username\":\"smartinez\",\"password\":\"123456\"}'
```

Debe devolver `access_token`. Si falla, revisar logs:
```powershell
gcloud run services logs read trendify-backend --region=southamerica-east1 --limit=50
```

---

## Fase 4 — Deploy del frontend en Firebase Hosting

### 4.1 Apuntar el frontend al backend real

Editar `frontend/.env.production` y reemplazar el placeholder:
```
VITE_API_BASE_URL=https://trendify-backend-xxxxxxxx-rj.a.run.app
```

### 4.2 Inicializar Firebase Hosting

```powershell
cd c:\Users\diego\Documents\GitHub\2026\frontend
firebase init hosting
```

Responder al wizard:
- **Project**: `Use an existing project` → seleccionar `FIREBASE_PROJECT_ID`
- **Public directory**: `dist`
- **Configure as single-page app**: `Yes`
- **Set up automatic builds with GitHub**: `No`
- **Overwrite dist/index.html**: `No`

Genera `firebase.json` y `.firebaserc`.

### 4.3 Build + deploy

```powershell
npm run build
firebase deploy --only hosting
```

Imprime: `Hosting URL: https://FIREBASE_PROJECT_ID.web.app`.

---

## Fase 5 — Verificación end-to-end en producción

1. Abrir `https://FIREBASE_PROJECT_ID.web.app` en el navegador.
2. Tienda pública debe cargar con productos (placeholder o imagen si copiaste a `frontend/public/products/` antes del build).
3. Click en "Acceso personal" → login con `smartinez` / `123456`.
4. En DevTools → Network: verificar que las llamadas van a `https://trendify-backend-xxxxxxxx-rj.a.run.app/api/...` y devuelven 200.
5. Probar flujo completo:
   - **CU13**: crear un proveedor.
   - **CU12**: registrar una compra → stock sube.
   - **CU08+CU09**: vender en Caja con efectivo → vuelto correcto.
   - **CU10**: descargar PDF del recibo.
   - **CU11**: ver inventario actualizado.
6. Si hay error CORS, revisar el secret `cors-origins` y el dominio exacto de Firebase.

---

## Updates posteriores

### Backend (cambio de código)
```powershell
cd c:\Users\diego\Documents\GitHub\2026\backend
gcloud run deploy trendify-backend --source . --region=southamerica-east1
```

### Frontend (cambio de código o de imágenes en `public/products/`)
```powershell
cd c:\Users\diego\Documents\GitHub\2026\frontend
npm run build
firebase deploy --only hosting
```

### Cambio de schema/seed en BD
1. Levantar Cloud SQL Auth Proxy (Fase 2.2 paso 2).
2. Aplicar el script SQL nuevo con `psql -U trendify -h 127.0.0.1 -d cosmetica_sistema -f <archivo.sql>`.

---

## Estimación de costo (free tier de GCP en 2026)

| Servicio | Free tier | Notas |
|---|---|---|
| Cloud Run | 2 M requests/mes + 360k GB-segundos | Suficiente para defensa académica |
| Cloud SQL `db-f1-micro` | NO está en free tier permanente, pero hay $300 USD de crédito inicial | Costo estimado: ~$8-10 USD/mes si se deja prendida |
| Cloud Build | 120 builds-min/día | Sobra |
| Secret Manager | 6 secrets activos gratis | OK |
| Firebase Hosting | 10 GB transfer/mes + 360 MB storage | OK |

**Tip:** después de la defensa, `gcloud sql instances delete trendify-db` para no seguir pagando.
