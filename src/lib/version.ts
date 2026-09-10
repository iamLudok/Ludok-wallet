/**
 * Versión del formato de datos (esquema local Y copias de seguridad).
 *
 * Ludovis nace en nativo, así que empieza en 1: no hay ninguna versión web
 * anterior con la que tener que cuadrar, al revés que en Ludok Time.
 *
 * Vive en un módulo propio y sin dependencias para que lo puedan usar tanto los
 * mapeadores de filas como el núcleo de copias sin crear un ciclo de imports.
 */
export const SCHEMA_VERSION = 1
