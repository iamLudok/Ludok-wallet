// Definición de tablas para Drizzle. Solo describe las columnas: las tablas y
// los índices se crean con SQL explícito en `db.ts` (migraciones por
// PRAGMA user_version).
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import type { CardType, CodeFormat } from '../types'

export const cards = sqliteTable('cards', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').$type<CardType>().notNull().default('other'),
  photo: text('photo'),
  photoBack: text('photoBack'),
  phone: text('phone'),
  phone2: text('phone2'),
  email: text('email'),
  address: text('address'),
  website: text('website'),
  social: text('social'),
  /** Lista de etiquetas serializada como JSON. Ver `rows.ts`. */
  tags: text('tags'),
  addedAt: integer('addedAt').notNull(),
  updatedAt: integer('updatedAt').notNull(),
})

export const tickets = sqliteTable('tickets', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  eventAt: integer('eventAt'),
  venue: text('venue'),
  price: text('price'),
  code: text('code').notNull(),
  codeFormat: text('codeFormat').$type<CodeFormat>().notNull().default('qr'),
  image: text('image'),
  notes: text('notes'),
  addedAt: integer('addedAt').notNull(),
  updatedAt: integer('updatedAt').notNull(),
})

export const settings = sqliteTable('settings', {
  id: text('id').primaryKey(),
  theme: text('theme').$type<'dark' | 'light' | 'system'>().notNull().default('system'),
  lastBackup: integer('lastBackup').notNull().default(0),
  schemaVersion: integer('schemaVersion').notNull(),
  nextcloudUrl: text('nextcloudUrl'),
  nextcloudUser: text('nextcloudUser'),
  nextcloudPassword: text('nextcloudPassword'),
  nextcloudFolder: text('nextcloudFolder'),
  // SQLite no tiene booleano: se guarda 0/1 y Drizzle lo traduce.
  autoBackup: integer('autoBackup', { mode: 'boolean' }),
  lastAutoBackupAt: integer('lastAutoBackupAt'),
})

export type CardRow = typeof cards.$inferSelect
export type TicketRow = typeof tickets.$inferSelect
export type SettingsRow = typeof settings.$inferSelect
