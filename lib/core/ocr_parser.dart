/// Extrae campos estructurados del texto bruto devuelto por ML Kit OCR.
class OcrResult {
  const OcrResult({
    this.phone,
    this.address,
    this.website,
    this.email,
    this.socialLink,
    this.rawText = '',
  });
  final String? phone;
  final String? address;
  final String? website;
  final String? email;
  final String? socialLink;
  final String rawText;
}

/// Fusiona dos resultados OCR (anverso + reverso), dando prioridad al primero.
OcrResult mergeOcrResults(OcrResult a, OcrResult b) => OcrResult(
      phone: a.phone ?? b.phone,
      address: a.address ?? b.address,
      website: a.website ?? b.website,
      email: a.email ?? b.email,
      socialLink: a.socialLink ?? b.socialLink,
      rawText: '${a.rawText}\n${b.rawText}'.trim(),
    );

OcrResult parseOcrText(String text) {
  final lines = text.split('\n').map((l) => l.trim()).where((l) => l.isNotEmpty).toList();

  String? phone;
  String? address;
  String? website;
  String? email;
  String? socialLink;

  final phoneRe = RegExp(r'(\+?\d[\d\s\-\.]{6,14}\d)');
  final emailRe = RegExp(r'[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}', caseSensitive: false);
  final urlRe = RegExp(
    r"((?:https?://)?(?:www\.)?[\w\-]+\.[a-zA-Z]{2,}(?:/[\w\-._~:/?#\[\]@!$&'()*+,;=%]*)?)",
    caseSensitive: false,
  );
  final socialRe = RegExp(
    r'(?:instagram|facebook|twitter|linkedin|tiktok|whatsapp|youtube|x\.com)[^\s]*|@[\w.]+',
    caseSensitive: false,
  );
  final addressRe = RegExp(
    r'(?:c/?\.?|calle|avda?\.?|avenida|plaza|pza?\.?|paseo|ps\.?|carretera|ctra\.?)\s+\S',
    caseSensitive: false,
  );
  final zipRe = RegExp(r'\b\d{5}\b');

  for (final line in lines) {
    if (email == null) {
      final m = emailRe.firstMatch(line);
      if (m != null) email = m.group(0);
    }

    if (socialLink == null) {
      final m = socialRe.firstMatch(line);
      if (m != null) socialLink = m.group(0);
    }

    if (phone == null) {
      final m = phoneRe.firstMatch(line);
      if (m != null) {
        final candidate = m.group(1)!.replaceAll(RegExp(r'\s+'), ' ').trim();
        if (candidate.replaceAll(RegExp(r'\D'), '').length >= 7) {
          phone = candidate;
        }
      }
    }

    if (website == null && email == null) {
      final m = urlRe.firstMatch(line);
      if (m != null) {
        final candidate = m.group(1)!;
        if (candidate.contains('.') &&
            !RegExp(r'^\d').hasMatch(candidate) &&
            !candidate.contains('@')) {
          website = candidate;
        }
      }
    }

    if (address == null) {
      if (addressRe.hasMatch(line) || zipRe.hasMatch(line)) {
        address = line;
      }
    }
  }

  return OcrResult(
    phone: phone,
    address: address,
    website: website,
    email: email,
    socialLink: socialLink,
    rawText: text,
  );
}

// ── Ticket OCR ──────────────────────────────────────────────────────────────

class TicketOcrResult {
  const TicketOcrResult({
    this.title,
    this.eventDateTime,
    this.venue,
    this.price,
    this.rawText = '',
  });
  final String? title;
  final DateTime? eventDateTime;
  final String? venue;
  final String? price;
  final String rawText;
}

TicketOcrResult parseTicketOcrText(String text) {
  final lines = text.split('\n').map((l) => l.trim()).where((l) => l.isNotEmpty).toList();

  String? title;
  DateTime? eventDateTime;
  String? venue;
  String? price;

  // Precio: 12€ | €12 | 12,50 EUR | precio: 12.50
  final priceRe = RegExp(
    r'(?:€\s*\d+[\.,]?\d*|\d+[\.,]\d{2}\s*€|\d+\s*euros?|\bprecio:?\s*\d+[\.,]?\d*)',
    caseSensitive: false,
  );

  // Lugar: palabras clave de recintos
  final venueRe = RegExp(
    r'(?:sala|estadio|teatro|pabellón|palacio|auditorio|arena|recinto|polideportivo|velódromo|campo|pista)',
    caseSensitive: false,
  );

  // Fechas en español: "14 de junio de 2026" | "14/06/2026" | "14-06-26"
  final dateLongRe = RegExp(
    r'(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)(?:\s+de\s+(\d{4}))?',
    caseSensitive: false,
  );
  final dateShortRe = RegExp(r'(\d{1,2})[/\-\.](\d{1,2})[/\-\.](\d{2,4})');
  final timeRe = RegExp(r'(\d{1,2})[:\.](\d{2})\s*(?:h|hrs?)?(?:\b|$)', caseSensitive: false);

  const monthNames = {
    'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4,
    'mayo': 5, 'junio': 6, 'julio': 7, 'agosto': 8,
    'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12,
  };

  for (final line in lines) {
    if (price == null) {
      final m = priceRe.firstMatch(line);
      if (m != null) price = m.group(0)!.trim();
    }

    if (venue == null && venueRe.hasMatch(line)) {
      venue = line;
    }

    if (eventDateTime == null) {
      // Fecha larga
      final ml = dateLongRe.firstMatch(line);
      if (ml != null) {
        final day = int.tryParse(ml.group(1)!) ?? 1;
        final month = monthNames[ml.group(2)!.toLowerCase()] ?? 1;
        final yearStr = ml.group(3);
        final year = yearStr != null
            ? int.tryParse(yearStr) ?? DateTime.now().year
            : DateTime.now().year;
        // Buscar hora en la misma línea
        final mt = timeRe.firstMatch(line);
        final hour = mt != null ? (int.tryParse(mt.group(1)!) ?? 0) : 0;
        final minute = mt != null ? (int.tryParse(mt.group(2)!) ?? 0) : 0;
        eventDateTime = DateTime(year, month, day, hour, minute);
      }

      // Fecha corta
      final ms = dateShortRe.firstMatch(line);
      if (ms != null) {
        final d = int.tryParse(ms.group(1)!) ?? 1;
        final mo = int.tryParse(ms.group(2)!) ?? 1;
        var y = int.tryParse(ms.group(3)!) ?? DateTime.now().year;
        if (y < 100) y += 2000;
        final mt = timeRe.firstMatch(line);
        final hour = mt != null ? (int.tryParse(mt.group(1)!) ?? 0) : 0;
        final minute = mt != null ? (int.tryParse(mt.group(2)!) ?? 0) : 0;
        eventDateTime = DateTime(y, mo, d, hour, minute);
      }
    }
  }

  // Título: primer línea larga que no sea solo números/precio/fecha
  for (final line in lines) {
    if (line.length < 4) continue;
    if (priceRe.hasMatch(line)) continue;
    if (dateLongRe.hasMatch(line) || dateShortRe.hasMatch(line)) continue;
    if (RegExp(r'^\d+$').hasMatch(line)) continue;
    title = line;
    break;
  }

  return TicketOcrResult(
    title: title,
    eventDateTime: eventDateTime,
    venue: venue,
    price: price,
    rawText: text,
  );
}
