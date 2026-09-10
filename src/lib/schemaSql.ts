/**
 * DDL del esquema local. Vive aparte de `db.ts` (que importa expo-sqlite, y por
 * tanto solo funciona en el móvil) para que las pruebas de escritorio puedan
 * crear EXACTAMENTE el mismo esquema que crea la app. Si esto estuviera
 * duplicado en el test, el test validaría un esquema que no es el real.
 */
export const CREATE_SQL = `
CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'other',
  photo TEXT,
  photoBack TEXT,
  phone TEXT,
  phone2 TEXT,
  email TEXT,
  address TEXT,
  website TEXT,
  social TEXT,
  tags TEXT,
  addedAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  eventAt INTEGER,
  venue TEXT,
  price TEXT,
  code TEXT NOT NULL,
  codeFormat TEXT NOT NULL DEFAULT 'qr',
  image TEXT,
  notes TEXT,
  addedAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY NOT NULL,
  theme TEXT NOT NULL DEFAULT 'system',
  lastBackup INTEGER NOT NULL DEFAULT 0,
  schemaVersion INTEGER NOT NULL,
  nextcloudUrl TEXT,
  nextcloudUser TEXT,
  nextcloudPassword TEXT,
  nextcloudFolder TEXT,
  autoBackup INTEGER,
  lastAutoBackupAt INTEGER
);

CREATE INDEX IF NOT EXISTS cards_type_idx ON cards (type);
CREATE INDEX IF NOT EXISTS cards_name_idx ON cards (name);
CREATE INDEX IF NOT EXISTS tickets_eventAt_idx ON tickets (eventAt);
`

/**
 * Cambios de esquema sobre bases ya creadas, en orden. El índice del array + 1
 * es la versión a la que lleva cada paso (`PRAGMA user_version`).
 *
 * `CREATE_SQL` de arriba siempre describe el esquema COMPLETO y actual, así que
 * una instalación nueva no ejecuta ninguno de estos pasos: son solo para bases
 * que ya existían antes del cambio. De momento está vacío (el esquema nace en
 * v1), pero la red de seguridad —y su verificación— ya está puesta, que es lo
 * que hace falta tener ANTES del primer paso real y no después.
 */
export const MIGRATIONS: string[] = []

/** Versión actual del esquema local. */
export const DB_VERSION = MIGRATIONS.length + 1
