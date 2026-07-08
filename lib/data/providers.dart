import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'database.dart';

/// Instancia única de la base de datos para toda la app.
final databaseProvider = Provider<AppDatabase>((ref) {
  final db = AppDatabase();
  ref.onDispose(db.close);
  return db;
});

/// Stream de restaurantes; la UI se reconstruye sola al cambiar los datos.
final restaurantsProvider = StreamProvider<List<Restaurant>>((ref) {
  return ref.watch(databaseProvider).watchRestaurants();
});

/// Conjunto de etiquetas existentes, derivado de los restaurantes guardados.
final tagsProvider = Provider<List<String>>((ref) {
  final asyncRestaurants = ref.watch(restaurantsProvider);
  final restaurants = asyncRestaurants.asData?.value ?? const [];
  final tags = <String>{};
  for (final r in restaurants) {
    for (final t in r.tags.split(',')) {
      final tag = t.trim();
      if (tag.isNotEmpty) tags.add(tag);
    }
  }
  final sorted = tags.toList()..sort();
  return sorted;
});

/// Stream de entradas de eventos.
final ticketsProvider = StreamProvider<List<Ticket>>((ref) {
  return ref.watch(databaseProvider).watchTickets();
});
