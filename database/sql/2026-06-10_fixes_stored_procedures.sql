-- ============================================================================
-- Correcciones de stored procedures — auditoría 2026-06-10
--
-- Aplicado a la base local (XAMPP). Para aplicar en la base remota:
--   mysql -h 45.71.32.111 -P 3310 -u root -p dbperuc_apiposmprueba < este_archivo.sql
--
-- Cambios:
--  1. sp_crearFacturacion: num_serie/num_documento eran SMALLINT/BIGINT pero las
--     columnas son varchar(50) — series alfanuméricas ("F001") fallaban y los
--     ceros a la izquierda se perdían. Ahora VARCHAR(50).
--  2. ObtenerArticuloDetalle: ahora exige el ruc de la empresa (antes cualquier
--     id devolvía artículos de cualquier empresa).
--  3. ObtenerDetallesVenta / ObtenerFormasPagoVenta: ahora filtran por
--     RUCEMPRESA vía JOIN a ventas (la PK de ventas es compuesta e incluye
--     RUCEMPRESA: la misma serie/número puede existir en dos empresas).
--  4. Las 5 gráficas del dashboard (sp_GraficaVentasPorDia/FormaPago/Articulo/
--     TopArticulos/Sucursal): ahora reciben pRuc y filtran por RUCEMPRESA
--     (antes mezclaban las ventas de TODAS las empresas).
--
-- Los controladores PHP ya fueron actualizados para pasar el parámetro nuevo.
-- ============================================================================

DELIMITER ;;

-- ----------------------------------------------------------------------------
-- 1. sp_crearFacturacion — tipos correctos para serie/número de documento
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_crearFacturacion`;;
CREATE PROCEDURE `sp_crearFacturacion`(
  IN p_tipo_documento TINYINT,
  IN p_num_serie VARCHAR(50),
  IN p_num_documento VARCHAR(50),
  IN p_cod_proveedor INT,
  IN p_fecha DATETIME,
  IN p_valor_compra DECIMAL(18,2)
)
BEGIN
  INSERT INTO facturacion (
    tipo_documento, num_serie, num_documento,
    cod_proveedor, fecha, valor_compra,
    estado, created_at, updated_at
  )
  VALUES (
    p_tipo_documento, p_num_serie, p_num_documento,
    p_cod_proveedor, p_fecha, p_valor_compra,
    1, NOW(), NOW()
  );

  SELECT LAST_INSERT_ID() AS id;
END;;

-- ----------------------------------------------------------------------------
-- 2. ObtenerArticuloDetalle — scoping por empresa
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `ObtenerArticuloDetalle`;;
CREATE PROCEDURE `ObtenerArticuloDetalle`(
    IN p_id INT,
    IN p_ruc VARCHAR(11)
)
BEGIN
    SELECT
        codarticulo,
        codfamilia,
        codsubfamilia,
        nombrearticulo,
        nombrecorto,
        stockminimo,
        stockmaximo,
        tipoigv,
        codbarra,
        foto,
        codigosunat,
        icbper,
        montoicbper,
        controlpeso,
        codartnue,
        estado
    FROM articulos
    WHERE codarticulo = p_id
      AND ruc = p_ruc;
END;;

-- ----------------------------------------------------------------------------
-- 3a. ObtenerDetallesVenta — scoping por empresa vía JOIN a ventas
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `ObtenerDetallesVenta`;;
CREATE PROCEDURE `ObtenerDetallesVenta`(
    IN cod_documento_param VARCHAR(10),
    IN seri_venta_param VARCHAR(10),
    IN nume_venta_param INT,
    IN ruc_param VARCHAR(11)
)
BEGIN
    SELECT
        vd.*,
        a.nombrearticulo
    FROM ventasdetalle AS vd
    INNER JOIN articulos AS a
        ON vd.COD_ARTICULO = a.codarticulo
    INNER JOIN ventas AS v
        ON  v.COD_DOCUMENTO = vd.COD_DOCUMENTO
        AND v.SERI_VENTA    = vd.SERI_VENTA
        AND v.NUME_VENTA    = vd.NUME_VENTA
    WHERE
        vd.COD_DOCUMENTO COLLATE utf8mb4_unicode_ci =
            CAST(cod_documento_param AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci
        AND vd.SERI_VENTA COLLATE utf8mb4_unicode_ci =
            CAST(seri_venta_param AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci
        AND vd.NUME_VENTA = nume_venta_param
        AND v.RUCEMPRESA = ruc_param;
END;;

-- ----------------------------------------------------------------------------
-- 3b. ObtenerFormasPagoVenta — scoping por empresa vía JOIN a ventas
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `ObtenerFormasPagoVenta`;;
CREATE PROCEDURE `ObtenerFormasPagoVenta`(
    IN cod_documento_param VARCHAR(10),
    IN seri_venta_param VARCHAR(10),
    IN nume_venta_param INT,
    IN ruc_param VARCHAR(11)
)
BEGIN
    SELECT fp.*
    FROM ventaformapago AS fp
    INNER JOIN ventas AS v
        ON  v.COD_DOCUMENTO = fp.COD_DOCUMENTO
        AND v.SERI_VENTA    = fp.SERI_VENTA
        AND v.NUME_VENTA    = fp.NUME_VENTAS
    WHERE
        fp.COD_DOCUMENTO COLLATE utf8mb4_unicode_ci =
            CAST(cod_documento_param AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci
        AND fp.SERI_VENTA COLLATE utf8mb4_unicode_ci =
            CAST(seri_venta_param AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci
        AND fp.NUME_VENTAS = nume_venta_param
        AND v.RUCEMPRESA = ruc_param;
END;;

-- ----------------------------------------------------------------------------
-- 4a. sp_GraficaVentasPorDia — filtro por empresa
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_GraficaVentasPorDia`;;
CREATE PROCEDURE `sp_GraficaVentasPorDia`(
    IN pMes INT,
    IN pAnio INT,
    IN pRuc VARCHAR(11)
)
BEGIN
    SELECT
        DAY(STR_TO_DATE(v.FEMI_VENTA, '%Y-%m-%d')) AS Dia,
        SUM(v.TOTAL_VENTA) AS MontoTotal
    FROM ventas v
    WHERE
        v.RUCEMPRESA = pRuc
        AND (pMes IS NULL
             OR MONTH(STR_TO_DATE(v.FEMI_VENTA, '%Y-%m-%d')) = pMes)
        AND (pAnio IS NULL
             OR YEAR(STR_TO_DATE(v.FEMI_VENTA, '%Y-%m-%d')) = pAnio)
    GROUP BY DAY(STR_TO_DATE(v.FEMI_VENTA, '%Y-%m-%d'))
    ORDER BY Dia;
END;;

-- ----------------------------------------------------------------------------
-- 4b. sp_GraficaVentasPorFormaPago — filtro por empresa
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_GraficaVentasPorFormaPago`;;
CREATE PROCEDURE `sp_GraficaVentasPorFormaPago`(
    IN pMes INT,
    IN pAnio INT,
    IN pRuc VARCHAR(11)
)
BEGIN
    SELECT
        mfp.descripcion AS FormaPago,
        SUM(v.TOTAL_VENTA) AS MontoTotal
    FROM ventas v
    JOIN ventaformapago fp
        ON  v.COD_DOCUMENTO = fp.COD_DOCUMENTO
        AND v.SERI_VENTA    = fp.SERI_VENTA
        AND v.NUME_VENTA    = fp.NUME_VENTAS
    JOIN maestroformapago mfp
        ON fp.ID_FPAGO = mfp.codformapago
    WHERE
        v.RUCEMPRESA = pRuc
        AND (pMes IS NULL
             OR MONTH(STR_TO_DATE(v.FEMI_VENTA, '%Y-%m-%d')) = pMes)
        AND (pAnio IS NULL
             OR YEAR(STR_TO_DATE(v.FEMI_VENTA, '%Y-%m-%d')) = pAnio)
    GROUP BY mfp.descripcion
    ORDER BY MontoTotal DESC;
END;;

-- ----------------------------------------------------------------------------
-- 4c. sp_GraficaVentasPorArticulo — filtro por empresa
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_GraficaVentasPorArticulo`;;
CREATE PROCEDURE `sp_GraficaVentasPorArticulo`(
    IN pMes INT,
    IN pAnio INT,
    IN pRuc VARCHAR(11)
)
BEGIN
    SELECT
        vd.COD_ARTICULO AS Articulo,
        SUM(vd.CANT_VENTASD * vd.PUNI_VENTASD) AS MontoTotal
    FROM ventas v
    JOIN ventasdetalle vd
        ON  v.COD_DOCUMENTO = vd.COD_DOCUMENTO
        AND v.SERI_VENTA    = vd.SERI_VENTA
        AND v.NUME_VENTA    = vd.NUME_VENTA
    WHERE
        v.RUCEMPRESA = pRuc
        AND (pMes IS NULL
             OR MONTH(STR_TO_DATE(v.FEMI_VENTA, '%Y-%m-%d')) = pMes)
        AND (pAnio IS NULL
             OR YEAR(STR_TO_DATE(v.FEMI_VENTA, '%Y-%m-%d')) = pAnio)
    GROUP BY vd.COD_ARTICULO
    ORDER BY MontoTotal DESC;
END;;

-- ----------------------------------------------------------------------------
-- 4d. sp_GraficaTopArticulos — filtro por empresa
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_GraficaTopArticulos`;;
CREATE PROCEDURE `sp_GraficaTopArticulos`(
    IN pMes INT,
    IN pAnio INT,
    IN pLimite INT,
    IN pRuc VARCHAR(11)
)
BEGIN
    SELECT
        a.nombrearticulo AS Articulo,
        SUM(vd.CANT_VENTASD) AS CantidadVendida
    FROM ventas v
    JOIN ventasdetalle vd
        ON  v.COD_DOCUMENTO = vd.COD_DOCUMENTO
        AND v.SERI_VENTA    = vd.SERI_VENTA
        AND v.NUME_VENTA    = vd.NUME_VENTA
    JOIN articulos a
        ON vd.COD_ARTICULO = a.codarticulo
    WHERE
        v.RUCEMPRESA = pRuc
        AND (pMes IS NULL
             OR MONTH(STR_TO_DATE(v.FEMI_VENTA, '%Y-%m-%d')) = pMes)
        AND (pAnio IS NULL
             OR YEAR(STR_TO_DATE(v.FEMI_VENTA, '%Y-%m-%d')) = pAnio)
    GROUP BY a.nombrearticulo
    ORDER BY CantidadVendida DESC
    LIMIT pLimite;
END;;

-- ----------------------------------------------------------------------------
-- 4e. sp_GraficaVentasPorSucursal — filtro por empresa
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_GraficaVentasPorSucursal`;;
CREATE PROCEDURE `sp_GraficaVentasPorSucursal`(
    IN pMes INT,
    IN pAnio INT,
    IN pRuc VARCHAR(11)
)
BEGIN
    SELECT
        v.CODIGOSUCURSAL AS Sucursal,
        SUM(v.TOTAL_VENTA) AS MontoTotal
    FROM ventas v
    WHERE
        v.RUCEMPRESA = pRuc
        AND (pMes IS NULL OR MONTH(STR_TO_DATE(v.FEMI_VENTA, '%Y-%m-%d')) = pMes)
        AND (pAnio IS NULL OR YEAR(STR_TO_DATE(v.FEMI_VENTA, '%Y-%m-%d')) = pAnio)
    GROUP BY v.CODIGOSUCURSAL;
END;;

DELIMITER ;
