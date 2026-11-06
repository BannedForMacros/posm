# CLAUDE.md — Contexto del proyecto posmweb

Guía para asistentes de IA (y desarrolladores) que trabajen en este repositorio.
Última actualización del contexto: 2026-10-26.

## Qué es

POS web **multi-empresa (multi-tenant)** construido con **Laravel 11 + Inertia.js + React 18/19**.
Cada empresa se identifica por su **`ruc`** en la tabla `empresas`; los datos de negocio se filtran
por el RUC de la **empresa activa** (ver sección Multiempresa). Es un panel de gestión (artículos,
familias, proveedores, compras, almacenes, inventario, listas de precios, ventas, dashboard) que
convive con un **POS de escritorio externo** que también escribe en la misma base de datos
(sobre todo en la tabla `ventas` y vía varios stored procedures `Ins*`/`Get*`/`Upd*Dmk`).

## Stack y comandos

- **Backend**: Laravel 11, PHP 8.2+. Sesión web (no API tokens). Inertia para renderizar React.
- **Frontend**: React (páginas en `resources/js/Pages/**/*.jsx`), Vite, Tailwind, `@inertiajs/react` v2.
- **Build**: `npm run build` · **Dev**: `npm run dev` (Vite) · servidor: `php artisan serve`.
- **Rutas**: `php artisan route:list`. **Lint PHP**: `php -l <archivo>`.
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
  `sucursal`). **Pendientes de aplicar a MySQL** (el resto del esquema sigue sin migraciones).
- **Comando**: `php artisan posm:superadmin correo@ejemplo.com` (`--revoke` para quitar el rol).
- **Tests**: `tests/Feature/Admin/MultitenancyTest.php` cubre panel, membresías múltiples, cambio
  de empresa y aislamiento por tenant.

## Base de datos (¡leer antes de tocar nada de datos!)

- Motor: **MySQL/MariaDB**. La base se llama `dbperuc_apiposmprueba`.
  - **Local (desarrollo)**: XAMPP en `127.0.0.1:3306`, user `root`, sin contraseña.
    Cliente: `C:\xampp\mysql\bin\mysql.exe` (no está en el PATH).
  - **Remota (producción/pruebas)**: `45.71.32.111:3310`, user `root` (config comentada en `.env`).
  - La base local se creó copiando estructura + datos + SPs de la remota.
- **EL ESQUEMA NO ESTÁ EN MIGRACIONES.** Solo existen las 3 migraciones por defecto de Laravel.
  Las 36 tablas y los ~68 stored procedures viven en la base de datos. Hay dumps de referencia en:
  - `storage/app/schema_tables.sql` — estructura de tablas (sin datos).
  - `storage/app/sp_definitions.sql` — definiciones de todos los stored procedures.
  - **Al auditar o cambiar código, verifica las columnas/firmas reales contra estos dumps o
    consultando la BD** (`SHOW COLUMNS FROM <tabla>`, `SHOW CREATE PROCEDURE <sp>`).
- **Gran parte de la lógica vive en stored procedures** (`sp_crearFacturacion`, `ObtenerVentasPorRUC`,
  `sp_obtenerDetalleListaPrecios`, etc.). Los controladores los invocan con `DB::select("CALL ...")`.

## Convenciones y trampas importantes

1. **Las rutas "API" reales están en `routes/web.php`** (grupo `web` con sesión + CSRF), NO en
   `routes/api.php`. Por eso todo `fetch()` que haga POST/PUT/DELETE **debe enviar el header
   `X-CSRF-TOKEN`** (tomado de `<meta name="csrf-token">`). Los `axios` lo mandan solo.
   `routes/api.php` sí está registrado en `bootstrap/app.php`, pero casi no se usa.
2. **Multi-tenant por `ruc`**: todo listado/lectura/escritura de datos de negocio debe filtrar por
   `auth()->user()->ruc` (accessor que devuelve el RUC de la **empresa activa**). Para operaciones
   por `id`, verificar pertenencia antes de modificar/borrar (patrón `perteneceAlUsuario($id)` en
   los controladores). No uses `users.ruc` directamente: la fuente de verdad es `TenantContext`.
3. **`familia.codfamilia` es PK GLOBAL** (varchar(6), no compuesta con ruc). Los correlativos de
   familia se generan globalmente, NO por ruc (si filtras por ruc al generar, colisionan entre empresas).
   Códigos: familia = 3 dígitos ("001"), subfamilia = 6 dígitos ("001002" = familia 001 + sub 002).
   En `articulos`, `codfamilia`/`codsubfamilia` son varchar(6): se guardan **códigos, nunca nombres**.
4. **La tabla `ventas` tiene PK COMPUESTA**: `(COD_DOCUMENTO, SERI_VENTA, NUME_VENTA, RUCEMPRESA)`.
   No tiene columna `id`. `ventasdetalle` y `ventaformapago` NO tienen `ruc`; se vinculan a `ventas`
   por `(COD_DOCUMENTO, SERI_VENTA, NUME_VENTA)`. Los modelos `Venta`/`VentasDetalle` NO deben usarse
   con `find()`/`save()` por PK simple — solo con `where()`. Los detalles se leen vía SP.
5. **`FEMI_VENTA` es texto** y el dashboard lo parsea con `STR_TO_DATE(FEMI_VENTA, '%Y-%m-%d')`:
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

## Pendientes / decisiones abiertas

- **Aplicar `database/sql/2026-06-10_fixes_stored_procedures.sql` a la base remota** antes de
  desplegar este código contra ella (el PHP ya llama a los SPs con las firmas nuevas).
- **Coordinar con el equipo del POS de escritorio**: SPs `InsDocumentoVenta`/`InsDocumentoVenta2`
  tienen un bug (guardan el descuento en el campo del neto) y `sp_crearInventario`/
  `sp_actualizarInventario` referencian columnas inexistentes. No se tocaron porque los consume
  el sistema externo.
- **Doble fuente de stock**: el stock inicial vive en `inventario_inicial` y el stock operativo en
  `inventario`. Son tablas paralelas que pueden descuadrarse — revisar diseño si se reporta.
- **Roles básicos**: existen `admin`/`operador` por empresa y `is_superadmin`, pero todavía no hay
  permisos granulares por módulo: cualquier usuario con empresa activa puede modificar catálogos
  globales compartidos (operaciones SUNAT, tipos de documento).
- **Aplicar las migraciones multiempresa a MySQL** (`2026_10_26_000001..000004`) antes de desplegar.
  La `000003` cambia FKs y hace backfill: probarla primero en una copia de la base.
- **Producción**: poner `APP_DEBUG=false` y `SESSION_SECURE_COOKIE=true` (con HTTPS) en el `.env`.

## Reglas para asistentes de IA

- Antes de cambiar código que toca la BD, **verifica columnas y firmas de SP contra los dumps en
  `storage/app/` o consultando MySQL** — el esquema no está en migraciones y hay nombres engañosos.
- Cualquier nuevo endpoint de datos de negocio **debe filtrar por `ruc`** y, si opera por id,
  verificar pertenencia.
- `fetch()` con métodos de escritura **debe incluir `X-CSRF-TOKEN`**.
- Tras cambios: `php -l` en los PHP tocados, `php artisan route:list` para validar rutas, y
  `npm run build` para confirmar que el frontend compila.
- Mantener el casing correcto de imports (`@/Components/...`, `Button.jsx`, `Input.jsx`).
