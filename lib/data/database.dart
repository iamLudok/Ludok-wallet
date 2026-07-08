import 'dart:io';

import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

part 'database.g.dart';

/// Tarjeta de contacto/lugar guardada por el usuario.
class Restaurants extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get name => text().withLength(min: 1, max: 120)();

  /// Tipo de tarjeta: restaurant | person | shop | hotel | company | other
  TextColumn get cardType => text().withDefault(const Constant('other'))();

  TextColumn get photoPath => text().nullable()();
  TextColumn get photoBackPath => text().nullable()();
  TextColumn get phone => text().nullable()();
  TextColumn get phone2 => text().nullable()();
  TextColumn get email => text().nullable()();
  TextColumn get address => text().nullable()();
  TextColumn get website => text().nullable()();
  TextColumn get socialLink => text().nullable()();

  /// Etiquetas separadas por comas.
  TextColumn get tags => text().withDefault(const Constant(''))();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
}

/// Entrada de un evento, con su código escaneable.
class Tickets extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get title => text().withLength(min: 1, max: 160)();
  DateTimeColumn get eventDateTime => dateTime().nullable()();
  TextColumn get venue => text().nullable()();
  TextColumn get price => text().nullable()();

  /// Valor del código (lo que se codifica en el QR/barras).
  TextColumn get codeData => text()();

  /// Formato del código: qrCode, code128, ean13, etc.
  TextColumn get codeFormat => text().withDefault(const Constant('qrCode'))();

  /// Captura opcional de la entrada original.
  TextColumn get imagePath => text().nullable()();
  TextColumn get notes => text().nullable()();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
}

@DriftDatabase(tables: [Restaurants, Tickets])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_openConnection());

  @override
  int get schemaVersion => 3;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        onUpgrade: (m, from, to) async {
          if (from < 2) {
            await m.addColumn(restaurants, restaurants.cardType);
            await m.addColumn(restaurants, restaurants.photoBackPath);
            await m.addColumn(restaurants, restaurants.email);
            await m.addColumn(restaurants, restaurants.phone2);
            await m.addColumn(restaurants, restaurants.socialLink);
          }
          if (from < 3) {
            await m.addColumn(tickets, tickets.price);
          }
        },
      );

  // ---- Tarjetas ----
  Stream<List<Restaurant>> watchRestaurants() {
    return (select(restaurants)
          ..orderBy([(t) => OrderingTerm(expression: t.name)]))
        .watch();
  }

  Future<int> saveRestaurant(RestaurantsCompanion entry) {
    return into(restaurants).insertOnConflictUpdate(entry);
  }

  Future<void> deleteRestaurant(int id) {
    return (delete(restaurants)..where((t) => t.id.equals(id))).go();
  }

  // ---- Entradas ----
  Stream<List<Ticket>> watchTickets() {
    return (select(tickets)
          ..orderBy([
            (t) => OrderingTerm(expression: t.eventDateTime),
            (t) => OrderingTerm(expression: t.createdAt, mode: OrderingMode.desc),
          ]))
        .watch();
  }

  Future<int> saveTicket(TicketsCompanion entry) {
    return into(tickets).insertOnConflictUpdate(entry);
  }

  Future<void> deleteTicket(int id) {
    return (delete(tickets)..where((t) => t.id.equals(id))).go();
  }
}

LazyDatabase _openConnection() {
  return LazyDatabase(() async {
    final dir = await getApplicationDocumentsDirectory();
    final file = File(p.join(dir.path, 'ludovis.sqlite'));
    return NativeDatabase.createInBackground(file);
  });
}
