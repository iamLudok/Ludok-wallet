import 'package:flutter/material.dart';

const Map<String, String> kCardTypes = {
  'restaurant': 'Restaurante',
  'person': 'Persona',
  'shop': 'Tienda',
  'hotel': 'Hotel',
  'company': 'Empresa',
  'other': 'Otro',
};

const Map<String, IconData> kCardTypeIcons = {
  'restaurant': Icons.restaurant,
  'person': Icons.person_outline,
  'shop': Icons.shopping_bag_outlined,
  'hotel': Icons.hotel_outlined,
  'company': Icons.business_outlined,
  'other': Icons.credit_card_outlined,
};

/// Color de marca de Ludovis.
const Color kSeedColor = Color(0xFF6750A4);

ThemeData buildLightTheme() {
  return ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(seedColor: kSeedColor),
    cardTheme: const CardThemeData(
      clipBehavior: Clip.antiAlias,
      elevation: 1,
    ),
  );
}

ThemeData buildDarkTheme() {
  return ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: kSeedColor,
      brightness: Brightness.dark,
    ),
    cardTheme: const CardThemeData(
      clipBehavior: Clip.antiAlias,
      elevation: 1,
    ),
  );
}

/// Devuelve un color estable para una etiqueta, derivado de su texto, para que
/// la misma etiqueta tenga siempre el mismo color.
Color colorForTag(String tag) {
  final palette = <Color>[
    const Color(0xFFEF5350),
    const Color(0xFFAB47BC),
    const Color(0xFF5C6BC0),
    const Color(0xFF29B6F6),
    const Color(0xFF26A69A),
    const Color(0xFF66BB6A),
    const Color(0xFFFFA726),
    const Color(0xFF8D6E63),
    const Color(0xFFEC407A),
    const Color(0xFF42A5F5),
  ];
  final hash = tag.toLowerCase().codeUnits.fold<int>(0, (a, b) => a + b);
  return palette[hash % palette.length];
}
