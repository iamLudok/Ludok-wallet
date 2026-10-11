/**
 * Versión del formato de datos (esquema local Y copias de seguridad).
 *
 * Ludok Wallet nace en nativo, así que empieza en 1: no hay ninguna versión web
 * anterior con la que tener que cuadrar, al revés que en Ludok Time.
 *
 * Vive en un módulo propio y sin dependencias para que lo puedan usar tanto los
 * mapeadores de filas como el núcleo de copias sin crear un ciclo de imports.
 */
/**
 * v2: los teléfonos y la dirección de una tarjeta pasan de `phone`/`phone2`/
 * `address` (fijos) a `phones`/`addresses` (listas). Una copia v1 se sigue
 * aceptando: `backupCore.ts` migra esos campos al importar.
 *
 * v3: la tarjeta lleva `sortOrder` (orden manual) y, en caché, `lat`/`lng`
 * para el mapa. Una copia v1 o v2 se sigue aceptando: `backupCore.ts` asigna
 * un `sortOrder` a lo que llegue sin él, por nombre (como se enseñaban antes).
 */
export const SCHEMA_VERSION = 3
