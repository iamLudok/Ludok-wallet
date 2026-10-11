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
  phones TEXT,
  email TEXT,
  addresses TEXT,
  country TEXT,
  website TEXT,
  social TEXT,
  tags TEXT,
  sortOrder INTEGER NOT NULL DEFAULT 0,
  lat REAL,
  lng REAL,
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
 * que ya existían antes del cambio.
 */
export const MIGRATIONS: string[] = [
  // v1 → v2: los dos teléfonos fijos (`phone`/`phone2`) pasan a una lista que
  // se puede alargar, y lo mismo la dirección (`address`). Las columnas viejas
  // no se borran —no compensa el riesgo en SQLite—, pero sus datos se copian a
  // las nuevas para que una tarjeta ya guardada no pierda el teléfono o la
  // dirección que tenía. De paso, el tipo «hotel» pasa a «lodging» (etiqueta
  // «Alojamiento»), más genérico para cualquier alojamiento, no solo hoteles.
  `
  ALTER TABLE cards ADD COLUMN phones TEXT;
  ALTER TABLE cards ADD COLUMN addresses TEXT;
  ALTER TABLE cards ADD COLUMN country TEXT;
  UPDATE cards SET phones = (
    SELECT json_group_array(v) FROM (
      SELECT phone AS v WHERE phone IS NOT NULL AND phone <> ''
      UNION ALL
      SELECT phone2 AS v WHERE phone2 IS NOT NULL AND phone2 <> ''
    )
  ) WHERE (phone IS NOT NULL AND phone <> '') OR (phone2 IS NOT NULL AND phone2 <> '');
  UPDATE cards SET addresses = json_array(address) WHERE address IS NOT NULL AND address <> '';
  UPDATE cards SET type = 'lodging' WHERE type = 'hotel';
  `,
  // v2 → v3: orden manual de las tarjetas (arrastrar en el modo «Ordenar»).
  // Antes la lista solo se enseñaba alfabética; para que una base que ya
  // tenía tarjetas no las mezcle al azar la primera vez, se numeran en ESE
  // mismo orden alfabético (contando cuántos nombres van antes, con el id
  // como desempate) — así el orden inicial es el de siempre, y a partir de
  // ahí ya se puede reordenar a mano.
  `
  ALTER TABLE cards ADD COLUMN sortOrder INTEGER NOT NULL DEFAULT 0;
  UPDATE cards SET sortOrder = (
    SELECT COUNT(*) FROM cards AS c2 WHERE c2.name < cards.name OR (c2.name = cards.name AND c2.id < cards.id)
  );
  `,
  // v3 → v4: coordenadas en caché para el mapa de tarjetas. Empiezan vacías
  // (NULL): el mapa las va calculando la primera vez que las necesita, con
  // la dirección de cada tarjeta, y las guarda aquí para no volver a pedirlas.
  `
  ALTER TABLE cards ADD COLUMN lat REAL;
  ALTER TABLE cards ADD COLUMN lng REAL;
  `,
]

/** Versión actual del esquema local. */
export const DB_VERSION = MIGRATIONS.length + 1
