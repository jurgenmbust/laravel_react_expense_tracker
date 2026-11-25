# Clara · Laravel + React Expense Tracker

Sistema completo de gastos personales para estudiar React con un backend Laravel conocido. Incluye registro, edición y eliminación de gastos; categorías personalizadas; búsqueda, filtros, ordenamiento, paginación y un resumen de totales con distribución por categoría.

La aplicación se organiza en **API REST Laravel + frontend React independiente**. No utiliza Inertia: las solicitudes HTTP y la actualización del estado son explícitas para que puedas seguir cómo funciona React.

## Tecnologías

- PHP **8.4.28**, Laravel **13.44.1** y Eloquent.
- React **19.3.1**, TypeScript **7.0.2**, Vite **8.3.8** y Lucide React.
- PostgreSQL **17** en Docker Compose, con volumen persistente.
- PHPUnit **12.5.45**, Vitest **5.1.2** y React Testing Library.
- CSS puro, sin framework de estilos ni dependencias de gráficos.

Las versiones exactas de dependencias están en `backend/composer.lock` y `frontend/package-lock.json`. No actualices con `composer update` o `npm update` para una instalación normal: usa los archivos lock.

## Funcionalidad

- CRUD de gastos: concepto, monto, fecha, categoría y notas.
- CRUD de categorías, con nombre único sin distinguir mayúsculas y un color configurable.
- Bloqueo de eliminación de categorías que tienen gastos.
- Búsqueda por concepto, filtro por mes/categoría y orden por fecha/monto/concepto.
- Páginas de diez registros, con validación de parámetros en Laravel.
- Totales, promedio y distribución calculados con datos reales de PostgreSQL.
- Formularios con validación local, errores de Laravel por campo y conservación de borradores al fallar.
- Confirmación de eliminación, indicadores de carga, mensajes de éxito, navegación móvil y diálogos con soporte de teclado.
- Base vacía: no se cargan datos ficticios ni seeders de gastos.

## Requisitos

- Windows con PowerShell para los scripts incluidos. El código PHP/React también es portable a otros sistemas con sus runtimes instalados.
- Docker Desktop funcionando con contenedores Linux y Compose v2.
- PHP **8.4+** con `pdo_pgsql`, `mbstring`, `openssl`, `fileinfo`, `curl`, `dom`, `xml` y `zip`.
- Composer 2.
- Node.js **22.20+** compatible y npm.
- Microsoft Visual C++ Redistributable 2015–2022 x64 para el PHP portátil, si Windows lo requiere.

El PHP 8.2 de XAMPP no sirve para este proyecto. En este checkout ya se preparó PHP 8.4 portátil dentro de `.tools/php`, sin cambiar XAMPP. Esa carpeta está ignorada y no se sube a GitHub.

## Arranque en este checkout

Las dependencias, las claves locales, la base y las migraciones ya fueron preparadas. Abre tres terminales desde la raíz del proyecto:

**Terminal 1 — PostgreSQL:**

```powershell
docker compose up -d --wait
docker compose ps
```

**Terminal 2 — Laravel:**

```powershell
.\scripts\start-backend.ps1
```

**Terminal 3 — React:**

```powershell
cd frontend
npm run dev
```

- Aplicación: **http://localhost:5174**
- API: **http://localhost:8001/api/expenses**
- Salud de Laravel: **http://localhost:8001/up**
- PostgreSQL: **127.0.0.1:5434**

Se usan puertos diferentes de los proyectos anteriores. Si PowerShell bloquea scripts locales, puedes ejecutar directamente el PHP portátil desde la raíz:

```powershell
.\.tools\php\php.exe backend/artisan serve --host=127.0.0.1 --port=8001
```

El proxy de `frontend/vite.config.ts` envía `/api` a Laravel. Si cambias el puerto 8001, actualiza también ese proxy y reinicia Vite. El navegador utiliza un mismo origen y no necesita CORS para este flujo.

## Instalación después de clonar

Entra en esta carpeta dentro de tu copia del repositorio. Si no tienes un PHP compatible, descarga el portátil oficial y verifica su checksum con el script:

```powershell
.\scripts\install-php.ps1
```

Prepara las variables locales:

```powershell
Copy-Item .env.example .env
notepad .env
```

Cambia `DB_PASSWORD` por una contraseña local fuerte. No sobrescribas `.env` si ya existe. Después:

```powershell
.\scripts\sync-env.ps1
```

Esto crea `backend/.env` desde su ejemplo si falta, y sincroniza exclusivamente los valores de PostgreSQL. No imprime contraseñas. Cada `.env` queda ignorado. La raíz configura Compose y `backend/.env` configura Laravel; son dos archivos distintos.

Instala las dependencias de Laravel usando PHP 8.4. En PowerShell, si tu Composer utiliza el PHP antiguo de XAMPP, puedes usar su PHAR explícitamente:

```powershell
cd backend
..\.tools\php\php.exe C:\ProgramData\ComposerSetup\bin\composer.phar install
..\.tools\php\php.exe artisan key:generate
cd ..
```

La ruta del PHAR anterior corresponde al instalador habitual de Composer para Windows. Si tu instalación está en otra ubicación, sustituye esa ruta. Con PHP 8.4 seleccionado en PATH puedes usar simplemente `composer install`.

Inicia PostgreSQL y aplica las migraciones:

```powershell
docker compose up -d --wait
.\scripts\php.ps1 backend/artisan migrate
```

Instala React y verifica la compilación:

```powershell
cd frontend
npm ci
npm run build
cd ..
```

Después sigue las tres terminales de arranque. No necesitas Apache ni MySQL de XAMPP.

## Variables de entorno

| Ubicación | Variable | Uso |
| --- | --- | --- |
| Raíz y backend | DB_DATABASE | Base del sistema, por defecto expense_tracker |
| Raíz y backend | DB_USERNAME | Usuario de PostgreSQL |
| Raíz y backend | DB_PASSWORD | Contraseña local, nunca pública |
| Raíz y backend | DB_PORT | Puerto de PostgreSQL en la computadora, 5434 |
| Backend | DB_CONNECTION | pgsql |
| Backend | DB_HOST | 127.0.0.1 para PHP en el host |
| Backend | APP_NAME | Nombre de la aplicación |
| Backend | APP_ENV | local; testing para las pruebas |
| Backend | APP_KEY | Clave Laravel generada con artisan key:generate |
| Backend | APP_DEBUG | false en los archivos preparados |
| Backend | APP_URL | http://localhost:8001 |
| Backend | APP_LOCALE / APP_FALLBACK_LOCALE | es / en |
| Backend | APP_CURRENCY | CRC por defecto; una moneda para todo el registro |
| Backend | SESSION_DRIVER / CACHE_STORE | file; no necesitan tablas adicionales |
| Backend | QUEUE_CONNECTION | sync |
| Backend | LOG_CHANNEL / LOG_LEVEL | stack / warning |

El registro usa **una sola moneda**. Cambiar `APP_CURRENCY` cambia la etiqueta y formato, pero **no convierte los montos existentes**. Usa códigos ISO válidos, por ejemplo CRC o USD, y decide la moneda antes de registrar datos.

## Dinero y persistencia

Los montos se guardan en PostgreSQL con `NUMERIC(12,2)`, Eloquent los transforma a cadenas decimales y React los envía como texto. La suma y el promedio se calculan en PostgreSQL. JavaScript convierte valores a Number solo para presentación y porcentajes del gráfico; no calcula los saldos persistidos.

Los datos viven en el volumen `postgres_data`. `docker compose down` detiene el contenedor conservándolo. Cambiar la contraseña de `.env` después de inicializar el volumen no cambia automáticamente el usuario de PostgreSQL.

Las migraciones de Laravel crean categorías, gastos, índices, claves foráneas y restricciones. Agrega migraciones nuevas para cambios posteriores; no alteres una migración que ya haya sido aplicada a una base que quieras conservar.

## Estructura

```text
laravel_react_expense_tracker/
├── backend/
│   ├── app/Http/Controllers/     # API de gastos, categorías y resumen
│   ├── app/Http/Requests/        # Validación de entradas y filtros
│   ├── app/Http/Resources/       # Contrato JSON de gastos
│   ├── app/Models/               # Eloquent
│   ├── app/Services/ExpenseQuery.php # Filtros compartidos
│   ├── config/expenses.php       # Moneda del registro
│   ├── database/migrations/      # Esquema PostgreSQL
│   ├── routes/api.php
│   └── tests/Feature/            # Pruebas contra PostgreSQL
├── frontend/
│   ├── src/App.tsx              # Estado compartido y coordinación
│   ├── src/components/          # Formularios, tabla, gráfico, diálogos
│   ├── src/hooks/               # Carga cancelable y búsqueda diferida
│   ├── src/services/            # fetch, errores y operaciones HTTP
│   ├── src/types/               # Interfaces de TypeScript
│   ├── src/test/                # Pruebas de React
│   └── src/styles.css
├── scripts/                    # Herramientas PowerShell
├── docs/REACT_GUIDE.md          # Guía para estudiar el frontend
├── compose.yaml
├── .env.example
└── README.md
```

## API

| Método | Ruta | Resultado |
| --- | --- | --- |
| GET | /api/expenses | Gastos paginados con filtros |
| GET | /api/expenses/{id} | Un gasto |
| POST | /api/expenses | Crear, HTTP 201 |
| PUT / PATCH | /api/expenses/{id} | Actualizar los campos editables |
| DELETE | /api/expenses/{id} | Eliminar, HTTP 204 |
| GET | /api/categories | Categorías con número de gastos |
| GET | /api/categories/{id} | Una categoría |
| POST | /api/categories | Crear, HTTP 201 |
| PUT / PATCH | /api/categories/{id} | Editar nombre y color |
| DELETE | /api/categories/{id} | Eliminar si no tiene gastos |
| GET | /api/summary | Totales y distribución con los mismos filtros |

Filtros: `month=2026-11`, `search=compra`, `category_id=1`, `page=1`, `per_page=10`, `sort=spent_on|amount|title`, `direction=asc|desc`. Omitir `month` consulta todo el historial. `per_page` admite 1–50. La búsqueda trata `%` y `_` como texto literal.

POST/PUT de gastos:

```json
{
  "title": "Supermercado",
  "amount": "1500.25",
  "spent_on": "2026-11-25",
  "category_id": 1,
  "notes": "Compra semanal"
}
```

POST/PUT de categorías:

```json
{"name": "Alimentación", "color": "#6375cf"}
```

La lista de gastos devuelve `data`, `links` y `meta` de paginación Laravel. El detalle de un gasto devuelve `data` con su categoría anidada. Respuestas inválidas: 422 con `message` y `errors`; registros inexistentes: 404; conflictos de categorías: 409.

Los formularios muestran mensajes de error sin borrar el borrador. Las eliminaciones vacías 204 no se intentan interpretar como JSON.

## Pruebas

El backend usa una base **separada**, `expense_tracker_test`, en el mismo PostgreSQL. Nunca ejecutes pruebas destructivas contra tus gastos.

En este checkout `.env.testing` y la base de pruebas ya están preparadas. Para recrearlas después de clonar:

```powershell
docker compose exec db createdb -U expense_tracker expense_tracker_test
Copy-Item backend/.env backend/.env.testing
notepad backend/.env.testing
```

En el archivo de pruebas cambia `APP_ENV=testing` y `DB_DATABASE=expense_tracker_test`. Si cambiaste el nombre del usuario, úsalo en `createdb`. No repitas `createdb` si la base ya existe.

Desde la raíz:

```powershell
.\scripts\php.ps1 backend/artisan test
```

Las pruebas usan RefreshDatabase y comprueban que la base termina en `_test` antes de migrarla. Validan CRUD, montos, filtros, paginación, totales exactos, restricciones, duplicados y categorías en uso.

Frontend:

```powershell
cd frontend
npm test
npm run build
```

Verificación ejecutada: **10 pruebas backend / 53 aserciones** y **11 pruebas frontend**, todas aprobadas. Se verificaron por HTTP el proxy Vite→Laravel, creación/edición y totales. Un registro temporal sobrevivió al reinicio de PostgreSQL y después fue eliminado. El código de producción no utiliza datos ficticios. La automatización visual no obtuvo permiso del navegador; no se afirma una revisión visual interactiva completa.

## Cómo estudiar React

Empieza por [docs/REACT_GUIDE.md](docs/REACT_GUIDE.md). Sigue un guardado desde `ExpenseForm`, la función `saveExpense` en `App`, el servicio HTTP y de regreso al estado que actualiza la tabla y el resumen.

## GitHub y alcance

`.env`, `.env.testing`, `.tools`, `vendor`, `node_modules`, compilaciones, sesiones y logs están ignorados. Sube `composer.lock`, `package-lock.json` y ambos `.env.example`. No publiques bases exportadas ni archivos con gastos personales. El proyecto no se publica automáticamente.

No hay autenticación: es un registro personal para uso local o de confianza. Los servidores se enlazan a loopback. Antes de exponerlo públicamente, configura autenticación, autorización, HTTPS y un servidor de producción. `artisan serve` y Vite son servidores de desarrollo; `npm run build` compila React, pero no despliega el backend ni configura un proxy de producción.

## Detener

Pulsa Ctrl+C en las terminales de Laravel y Vite. Para PostgreSQL:

```powershell
docker compose down
```

El volumen permanece. No uses `down -v` salvo que quieras borrar deliberadamente todos los datos de este proyecto.
