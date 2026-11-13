# CLAUDE.md — Contexto del proyecto posmweb

Guía para asistentes de IA (y desarrolladores) que trabajen en este repositorio.
Última actualización del contexto: 2026-11-06.

## Qué es

POS web **multi-empresa (multi-tenant)** construido con **Laravel 11 + Inertia.js + React 18/19**.
Cada empresa se identifica por su **`ruc`** en la tabla `empresas`; los datos de negocio se filtran
por el RUC de la **empresa activa** (ver sección Multiempresa). Es un panel de gestión (artículos,
familias, proveedores, compras, almacenes, inventario, listas de precios, ventas, dashboard) que
convive con un **POS de escritorio externo** (sobre todo en la tabla `ventas` y vía varios stored
procedures `Ins*`/`Get*`/`Upd*Dmk`). Nota: el dev local del panel web se migró a **PostgreSQL**,
mientras que el POS de escritorio sigue sobre la base **MySQL** remota (ver sección Base de datos).

## Stack y comandos

- **Backend**: Laravel 11, PHP 8.2+ (el Mac de dev tiene PHP 8.5). Sesión web (no API tokens). Inertia para renderizar React.
- **Frontend**: React (páginas en `resources/js/Pages/**/*.jsx`), Vite, Tailwind, `@inertiajs/react` v2.
- **Build**: `npm run build` · **Dev**: `npm run dev` (Vite) · servidor: `php artisan serve`.
- **Rutas**: `php artisan route:list`. **Lint PHP**: `php -l <archivo>`.
- **Instalar deps**: `composer install --ignore-platform-req=php` (necesario en PHP 8.5: el lock pide ≤8.4) · `npm install`.
- **Tests**: `vendor/bin/phpunit` (SQLite en memoria; `php artisan test` no está disponible).

## Multiempresa (implementado oct 2026)

- **Fuente de verdad del tenant**: `App\Support\TenantContext` (singleton). Lo resuelve el
  middleware `tenant` (`ResolveEmpresaActiva`), que lee `empresa_activa_id` de la sesión y valida
  que el usuario pertenezca a la empresa. `User::ruc` es un **accessor** que devuelve el RUC de la
  empresa activa; la columna `users.ruc` queda como dato legado/por defecto.
- **Modelos**: `Empresa` (PK `id`, `ruc` único) y pivote `empresa_user` (`rol`: `admin`/`operador`,
  `activo`). Helpers en `User`: `empresas()`, `empresasDisponibles()`, `esSuperadmin()`,
  `perteneceAEmpresa()`, `rolEnEmpresa()`.
- **Locales**: la tabla `sucursal` incorpora `empresa_id`; `user_ruc` se mantiene sincronizado con
  el RUC de la empresa para no romper los stored procedures existentes.
- **Middleware** (`bootstrap/app.php`): `tenant` (resuelve la empresa activa), `empresa` (exige
  empresa; redirige a `/sin-empresa` o `/admin`), `superadmin` (protege `/admin`).
- **Panel superadmin** (`/admin`): dashboard, empresas (con usuarios y locales), usuarios (con
  membresías múltiples) y locales. Rutas con prefijo/nombre `admin.*` en `routes/web.php`.
- **Selector de empresa**: en el sidebar; `POST /empresa-activa/{empresa}` y
  `DELETE /empresa-activa`. La empresa activa vive **en sesión**, no en base de datos.
- **Registro público**: crea automáticamente la empresa y deja al usuario como `admin` de ella.
- **Migraciones nuevas**: `2026_10_26_000001` (empresas + pivote), `000002` (columnas en `users`),
  `000003` (repunta FKs de `users.ruc`, `inventario`, `inventario_inicial`, `proveedores`,
  `sucursal` y `warehouse_document` a `empresas.ruc`, con backfill) y `000004` (`empresa_id` en
  `sucursal`). La `000003` funciona en **MySQL y PostgreSQL** (probada contra una copia de la BD de
  producción). `2026_11_06_000001` corrige datos detectados en esa prueba: crea la operación
  `operacion.id=2` "Venta" (sin ella toda venta fallaba por FK), resincroniza las secuencias de
  Postgres (crear usuarios fallaba por `users_pkey`) y hace el RUC de proveedor único **por empresa**.
- **Comando**: `php artisan posm:superadmin correo@ejemplo.com` (`--revoke` para quitar el rol).
- **Tests**: `tests/Feature/Admin/MultitenancyTest.php` cubre panel, membresías múltiples, cambio
  de empresa y aislamiento por tenant.

## Base de datos (¡leer antes de tocar nada de datos!)

- Motor en dev local: **PostgreSQL 17** (Homebrew, `127.0.0.1:5432`), base `posm`, user `jesus`,
  sin contraseña (auth `trust` local). Config en `.env` (`DB_CONNECTION=pgsql`).
  - El dev local **se migró de MySQL a Postgres el 2026-06-16**. La base origen MySQL
    (`dbperuc_apiposmprueba`) sigue viva en remoto `45.71.32.111:3310`, user `root`
    (credenciales fuera del repo, var de entorno `MYSQL_REMOTE_PWD`).
  - El **POS de escritorio externo sigue en MySQL**; esta migración es solo para el panel web local.
- **EL ESQUEMA NO ESTÁ EN MIGRACIONES.** Solo existen las 3 migraciones por defecto de Laravel
  (users/cache/jobs). Las 27 tablas de negocio y las funciones portadas se crean con scripts SQL.
  Artefactos de la migración (carpeta gitignored) en `storage/app/_migracion_pg/`:
  - `01_mysql_schema_tables.sql` / `02_mysql_routines.sql` — dump original MySQL (referencia).
  - `04_pg_schema.sql` — DDL de tablas en Postgres · `05_pg_fks.sql` — claves foráneas.
  - `06_pg_functions.sql` — los 38 SPs portados a funciones `plpgsql`.
  - `load_data.php` — copia datos desde el MySQL remoto.
  - **Al auditar o cambiar código, verifica columnas/firmas reales contra estos scripts o
    consultando la BD** (`\d <tabla>`, `\df <funcion>` en `psql`).
- **Gran parte de la lógica vivía en stored procedures de MySQL.** Se portaron a **funciones
  PostgreSQL `plpgsql`** y los controladores ahora los invocan con `DB::select("SELECT * FROM x(...)")`
  (ya NO con `CALL`). Solo se portaron los **38 SPs que usa la web**; los ~30 del POS de escritorio
  (`Ins*`/`Get*`/`*Dmk`) siguen solo en el MySQL remoto.
- **Casing en SQL crudo**: las funciones con mayúsculas (`"ObtenerVentasPorRUC"`, `"sp_Grafica*"`)
  y las columnas en MAYÚSCULAS de `ventas`/`ventasdetalle`/`ventaformapago` (`"RUCEMPRESA"`,
  `"FEMI_VENTA"`, etc.) **deben ir entre comillas dobles** en cualquier SQL crudo (Postgres es
  sensible a mayúsculas en identificadores citados). El query builder de Eloquent ya las cita solo.

## Convenciones y trampas importantes

1. **Las rutas "API" reales están en `routes/web.php`** (grupo `web` con sesión + CSRF), NO en
   `routes/api.php`. Por eso todo `fetch()` que haga POST/PUT/DELETE **debe enviar el header
   `X-CSRF-TOKEN`** (tomado de `<meta name="csrf-token">`). Los `axios` lo mandan solo.
   `routes/api.php` sí está registrado en `bootstrap/app.php`, pero casi no se usa.
2. **Multi-tenant por `ruc`**: todo listado/lectura/escritura de datos de negocio debe filtrar por
   `auth()->user()->ruc` (accessor que devuelve el RUC de la **empresa activa**). Para operaciones
   por `id`, verificar pertenencia antes de modificar/borrar (patrón `perteneceAlUsuario($id)` en
   los controladores). No uses `users.ruc` directamente: la fuente de verdad es `TenantContext`.
3. **`familia` tiene PK POR EMPRESA `(ruc, codfamilia)`** (desde la migración `2026_11_13_000001`;
   antes era PK global). Los códigos los genera `FamiliaController`, nunca el usuario, con correlativo
   **por empresa**: familia = 3 dígitos ("001"), subfamilia = 6 dígitos ("001002" = familia 001 + sub 002).
   No uses `$familia->save()` ni la relación `Articulo::familia()` sin filtrar por `ruc` (Eloquent solo
   conoce `codfamilia` como clave y cruzaría empresas). En `articulos`, `codfamilia` (3) y
   `codsubfamilia` (3, solo la parte de la sub) guardan **códigos, nunca nombres**.
3b. **Artículos: `codarticulo` es el ID interno** (entero identity, PK global, lo usan las FKs y las
   rutas `/api/articulos-manage/{codarticulo}`). **`articulos.codigo` es el código visible y libre**
   (alfanumérico, MAYÚSCULAS, máx. 30, único por `(ruc, codigo)`); si no se envía se propone el siguiente
   número libre de la empresa. Utilidades/validación compartidas del frontend en
   `resources/js/Pages/ArticuloManage/utils/articulo.js`.
4. **La tabla `ventas` tiene PK COMPUESTA**: `(COD_DOCUMENTO, SERI_VENTA, NUME_VENTA, RUCEMPRESA)`.
   No tiene columna `id`. `ventasdetalle` y `ventaformapago` NO tienen `ruc`; se vinculan a `ventas`
   por `(COD_DOCUMENTO, SERI_VENTA, NUME_VENTA)`. Los modelos `Venta`/`VentasDetalle` NO deben usarse
   con `find()`/`save()` por PK simple — solo con `where()`. Los detalles se leen vía la función
   `ObtenerDetallesVenta`.
5. **`FEMI_VENTA` es texto** y el dashboard lo parsea con el helper `femi_to_date("FEMI_VENTA")`
   (función Postgres que envuelve `to_date(..., 'YYYY-MM-DD')` de forma segura ante nulos/vacíos):
   al insertar ventas, la fecha debe ir en formato `Y-m-d`.
6. **El usuario (`User`) tiene `name, email, ruc (legado), password, is_superadmin, activo`.**
   Los roles (`admin`/`operador`) viven en el pivote `empresa_user`, no en `users`.
7. **Casing de imports en React**: la carpeta real es `@/Components` (mayúscula) y los componentes
   `Button.jsx`/`Input.jsx` (mayúscula). Importar en minúscula funciona en Windows pero rompe el
   build en Linux/CI. Mantener el casing correcto.

## Trabajo realizado (auditoría de seguridad y bugs, jun 2026)

Se hizo una auditoría completa (backend, frontend, stored procedures, auth) y se corrigieron ~30
bugs. Resumen por si hay que continuar o revisar:

### Seguridad multi-tenant (era el problema más grave)
- Listados que mostraban datos de TODAS las empresas → ahora filtran por `ruc`: compras,
  proveedores, inventario, documentos/movimientos de almacén, y los KPIs/gráficas del dashboard.
- Operaciones por `id` sin verificación de propiedad (IDOR) → añadida verificación de pertenencia
  en almacenes, sucursales, proveedores, compras, detalle-facturación y listas de precios.
- `ObtenerArticuloDetalle`, `ObtenerDetallesVenta`, `ObtenerFormasPagoVenta` y las 5 gráficas del
  dashboard ahora exigen el `ruc` como parámetro (antes filtraban solo por id/serie → fuga entre
  empresas). **Estos SPs cambiaron de firma** — ver script más abajo.
- Rutas de artículos movidas dentro del middleware `auth` (estaban públicas).
- Registro: el `ruc` ahora exige exactamente 11 dígitos.

### Stored procedures corregidos
Script: **`database/sql/2026-06-10_fixes_stored_procedures.sql`** (aplicado a la base LOCAL;
**pendiente de aplicar a la remota**). Corrige: `sp_crearFacturacion` (tipos serie/número),
`ObtenerArticuloDetalle`, `ObtenerDetallesVenta`, `ObtenerFormasPagoVenta` y las 5 `sp_Grafica*`
(todas con scoping por `ruc`). **Antes de aplicarlo a la remota, confirmar que el POS de escritorio
no llame a esos SPs**, porque les cambió la firma (parámetro `ruc` extra).

### Bugs funcionales corregidos
- `ArticuloController`: importaba mal `DB` (500 garantizado) y devolvía HTML donde el frontend
  esperaba JSON.
- `ListaPreciosController`: llamaba a los SPs de detalle con menos parámetros de los que definen
  (crear/editar precios estaban rotos). Corregido controlador + modales.
- Editar/eliminar compra, desactivar lista de precios: faltaba CSRF (419). Corregido.
- Validación de stock en ventas: antes truncaba a 0 en silencio; ahora valida y devuelve 422.
- Subfamilias en modales de artículos: enviaban el nombre en vez del código (422). Corregido.
- Relaciones Eloquent rotas (`Venta`/`VentasDetalle`/`WarehouseDocument` referenciaban columnas
  inexistentes) → eliminadas/corregidas.
- Limpieza de dependencias: había React 18 y 19 a la vez y dos runtimes de Inertia. Migrado todo a
  `@inertiajs/react` v2 y una sola versión de React.

### "Crear venta" (implementado jun 2026, commit `6cca885`)
`VentasController::store` ahora **registra la venta real** en `ventas` + `ventasdetalle` (antes solo
generaba el movimiento de almacén y descartaba los datos del cliente). En una transacción:
valida stock → resuelve correlativo `NUME_VENTA` (autogenera si viene vacío, valida duplicado si no)
→ calcula totales con **IGV 18% (precio ingresado = con IGV incluido)** → inserta cabecera y detalle
→ genera documento de almacén → descuenta inventario. La venta ya aparece en el listado y el dashboard.

### Migración del dev local a PostgreSQL (jun 2026)
El entorno de desarrollo local se migró de MySQL/XAMPP a **PostgreSQL 17**. Qué cambió:
- Las 27 tablas de negocio se portaron a Postgres (tipos: `tinyint`→`smallint`, `datetime`→`timestamp`,
  `bit(1)`→`boolean`, `enum`→`varchar`+`CHECK`, `AUTO_INCREMENT`→`GENERATED BY DEFAULT AS IDENTITY`).
  Las columnas en MAYÚSCULAS se preservaron con comillas dobles para coincidir con Eloquent.
- Los **38 stored procedures que usa la web se reescribieron como funciones `plpgsql`**
  (`storage/app/_migracion_pg/06_pg_functions.sql`). Las que devuelven filas usan `RETURNS TABLE`/
  `RETURNS SETOF`; las de inserción devuelven `TABLE(id ...)`. Traducciones: `NOW()`→`now()`,
  `LAST_INSERT_ID()`→`INSERT ... RETURNING`, `IFNULL`→`COALESCE`, `STR_TO_DATE`→`femi_to_date`,
  `MONTH/YEAR/DAY`→`EXTRACT(...)`, `CAST(x AS UNSIGNED)`→`CAST(x AS INTEGER)`.
- Los **43 `CALL x(...)` del PHP se cambiaron a `SELECT * FROM x(...)`** en 10 controladores.
- Los SPs del POS de escritorio (`Ins*`/`Get*`/`*Dmk`) **no se portaron** (ese sistema sigue en MySQL).

## Pendientes / decisiones abiertas

- **Probar cada módulo en la UI tras la migración a Postgres** (ventas, facturación, listas de
  precios, almacenes, sucursales, inventario): los `CALL` se convirtieron a `SELECT * FROM` y las
  funciones se portaron a `plpgsql`; conviene validar cada flujo end-to-end.
- **El despliegue contra la base remota MySQL requiere otra estrategia**: el PHP ya llama a las
  funciones con sintaxis Postgres (`SELECT * FROM x(...)`). Para correr contra MySQL habría que
  revertir esa sintaxis y aplicar `database/sql/2026-06-10_fixes_stored_procedures.sql` a la remota.
  Decidir si producción será Postgres o MySQL.
- **Coordinar con el equipo del POS de escritorio**: SPs `InsDocumentoVenta`/`InsDocumentoVenta2`
  tienen un bug (guardan el descuento en el campo del neto) y `sp_crearInventario`/
  `sp_actualizarInventario` referencian columnas inexistentes. No se tocaron porque los consume
  el sistema externo.
- **Doble fuente de stock**: el stock inicial vive en `inventario_inicial` y el stock operativo en
  `inventario`. Son tablas paralelas que pueden descuadrarse — revisar diseño si se reporta.
- **Roles básicos**: existen `admin`/`operador` por empresa y `is_superadmin`, pero todavía no hay
  permisos granulares por módulo: cualquier usuario con empresa activa puede modificar catálogos
  globales compartidos (operaciones SUNAT, tipos de documento).
- **Desplegar multiempresa a producción** (`ssh dbperu`, `/opt/posm`, Postgres `dbperu-db`/`posm`):
  respaldar la BD, `php artisan migrate --force` (aplica `2026_10_26_000001..000004` y
  `2026_11_06_000001`), `npm run build`, y crear el superadmin con `php artisan posm:superadmin`.
- **Inertia v2**: `form.transform()` NO es encadenable (devuelve undefined). Llamarlo y luego `form.post()`.
- **Producción**: poner `APP_DEBUG=false` y `SESSION_SECURE_COOKIE=true` (con HTTPS) en el `.env`.

## Reglas para asistentes de IA

- Antes de cambiar código que toca la BD, **verifica columnas y firmas de función contra los scripts
  en `storage/app/_migracion_pg/` o consultando Postgres** (`\d <tabla>`, `\df <funcion>`) — el
  esquema no está en migraciones y hay nombres engañosos.
- En SQL crudo, **cita con comillas dobles** las funciones/columnas con mayúsculas
  (`"ObtenerVentasPorRUC"`, `"RUCEMPRESA"`, `"FEMI_VENTA"`, etc.); en Postgres es obligatorio.
- Para invocar una función portada desde PHP usa `DB::select("SELECT * FROM nombre(?, ...)", [...])`
  (NO `CALL`).
- Cualquier nuevo endpoint de datos de negocio **debe filtrar por `ruc`** y, si opera por id,
  verificar pertenencia.
- `fetch()` con métodos de escritura **debe incluir `X-CSRF-TOKEN`**.
- Tras cambios: `php -l` en los PHP tocados, `php artisan route:list` para validar rutas, y
  `npm run build` para confirmar que el frontend compila.
- Mantener el casing correcto de imports (`@/Components/...`, `Button.jsx`, `Input.jsx`).
