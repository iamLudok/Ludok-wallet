import 'dart:io';

import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:uuid/uuid.dart';

/// Copia una imagen elegida por el usuario al almacenamiento privado de la app
/// y devuelve la ruta del fichero guardado. En la base de datos solo se guarda
/// esta ruta, no la imagen en sí.
class ImageStorage {
  static const _uuid = Uuid();

  static Future<String> saveImage(File source) async {
    final dir = await getApplicationDocumentsDirectory();
    final imagesDir = Directory(p.join(dir.path, 'images'));
    if (!await imagesDir.exists()) {
      await imagesDir.create(recursive: true);
    }
    final ext = p.extension(source.path).isEmpty
        ? '.jpg'
        : p.extension(source.path);
    final dest = p.join(imagesDir.path, '${_uuid.v4()}$ext');
    final saved = await source.copy(dest);
    return saved.path;
  }

  /// Borra un fichero de imagen si existe (al eliminar o reemplazar).
  static Future<void> deleteIfExists(String? path) async {
    if (path == null || path.isEmpty) return;
    final file = File(path);
    if (await file.exists()) {
      await file.delete();
    }
  }
}
