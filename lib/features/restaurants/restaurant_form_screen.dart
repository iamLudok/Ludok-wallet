import 'dart:io';

import 'package:drift/drift.dart' show Value;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:image_cropper/image_cropper.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/ocr_parser.dart';
import '../../core/theme.dart';
import '../../core/widgets.dart';
import '../../data/database.dart';
import '../../data/image_storage.dart';
import '../../data/providers.dart';

class RestaurantFormScreen extends ConsumerStatefulWidget {
  const RestaurantFormScreen({super.key, this.restaurantId});
  final int? restaurantId;

  @override
  ConsumerState<RestaurantFormScreen> createState() =>
      _RestaurantFormScreenState();
}

class _RestaurantFormScreenState extends ConsumerState<RestaurantFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _phone2Ctrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _websiteCtrl = TextEditingController();
  final _socialCtrl = TextEditingController();
  final _tagCtrl = TextEditingController();

  String _cardType = 'other';
  String? _photoPath;
  File? _newPhotoFile;
  String? _photoBackPath;
  File? _newPhotoBackFile;
  List<String> _tags = [];
  bool _loading = false;
  bool _ocrRunning = false;

  @override
  void initState() {
    super.initState();
    if (widget.restaurantId != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _loadExisting());
    }
  }

  void _loadExisting() {
    final list = ref.read(restaurantsProvider).asData?.value ?? [];
    final r = list.where((r) => r.id == widget.restaurantId).firstOrNull;
    if (r == null) return;
    _nameCtrl.text = r.name;
    _phoneCtrl.text = r.phone ?? '';
    _phone2Ctrl.text = r.phone2 ?? '';
    _emailCtrl.text = r.email ?? '';
    _addressCtrl.text = r.address ?? '';
    _websiteCtrl.text = r.website ?? '';
    _socialCtrl.text = r.socialLink ?? '';
    _cardType = r.cardType;
    _photoPath = r.photoPath;
    _photoBackPath = r.photoBackPath;
    _tags = r.tags
        .split(',')
        .map((t) => t.trim())
        .where((t) => t.isNotEmpty)
        .toList();
    setState(() {});
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _phone2Ctrl.dispose();
    _emailCtrl.dispose();
    _addressCtrl.dispose();
    _websiteCtrl.dispose();
    _socialCtrl.dispose();
    _tagCtrl.dispose();
    super.dispose();
  }

  Future<void> _showPhotoOptions(bool isFront) async {
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      builder: (_) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('Sacar foto'),
              onTap: () => Navigator.pop(context, ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Elegir de la galería'),
              onTap: () => Navigator.pop(context, ImageSource.gallery),
            ),
          ],
        ),
      ),
    );
    if (source == null) return;
    final picker = ImagePicker();
    final picked = await picker.pickImage(
        source: source, imageQuality: 90, maxWidth: 2000);
    if (picked == null || !mounted) return;

    final cropped = await _cropImage(File(picked.path));
    if (!mounted) return;
    final file = cropped ?? File(picked.path);

    setState(() {
      if (isFront) {
        _newPhotoFile = file;
      } else {
        _newPhotoBackFile = file;
      }
    });
    _offerOcr(file);
  }

  Future<File?> _cropImage(File source) async {
    final cropped = await ImageCropper().cropImage(
      sourcePath: source.path,
      uiSettings: [
        AndroidUiSettings(
          toolbarTitle: 'Recortar foto',
          toolbarColor: Colors.black,
          toolbarWidgetColor: Colors.white,
          backgroundColor: Colors.black,
          lockAspectRatio: false,
          initAspectRatio: CropAspectRatioPreset.original,
          aspectRatioPresets: [
            CropAspectRatioPreset.original,
            CropAspectRatioPreset.square,
            CropAspectRatioPreset.ratio3x2,
            _PortraitPreset(),
          ],
        ),
      ],
    );
    return cropped == null ? null : File(cropped.path);
  }

  Future<void> _offerOcr(File imageFile) async {
    if (!mounted) return;
    final run = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('¿Escanear datos?'),
        content: const Text(
            'Puedo intentar detectar teléfono, email, dirección y web. ¿Lo pruebo?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('No, gracias')),
          FilledButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Sí, escanear')),
        ],
      ),
    );
    if (run == true) await _runOcr([imageFile]);
  }

  Future<void> _runOcr(List<File> images) async {
    setState(() => _ocrRunning = true);
    final recognizer = TextRecognizer(script: TextRecognitionScript.latin);
    try {
      OcrResult merged = const OcrResult();
      for (final img in images) {
        final recognized =
            await recognizer.processImage(InputImage.fromFile(img));
        final partial = parseOcrText(recognized.text);
        merged = mergeOcrResults(merged, partial);
      }

      if (!mounted) return;
      bool anyFilled = false;
      void fill(TextEditingController ctrl, String? val) {
        if (val != null && ctrl.text.isEmpty) {
          ctrl.text = val;
          anyFilled = true;
        }
      }

      fill(_phoneCtrl, merged.phone);
      fill(_emailCtrl, merged.email);
      fill(_addressCtrl, merged.address);
      fill(_websiteCtrl, merged.website);
      fill(_socialCtrl, merged.socialLink);

      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(anyFilled
            ? 'Datos detectados. Revisa y corrige si es necesario.'
            : 'No se detectaron datos reconocibles.'),
        duration: const Duration(seconds: 3),
      ));
    } finally {
      await recognizer.close();
      if (mounted) setState(() => _ocrRunning = false);
    }
  }

  void _addTag() {
    final t = _tagCtrl.text.trim().toLowerCase();
    if (t.isEmpty || _tags.contains(t)) return;
    setState(() => _tags.add(t));
    _tagCtrl.clear();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);

    Future<String?> persist(File? newFile, String? oldPath) async {
      if (newFile == null) return oldPath;
      if (oldPath != null) await ImageStorage.deleteIfExists(oldPath);
      return ImageStorage.saveImage(newFile);
    }

    final frontPath = await persist(_newPhotoFile, _photoPath);
    final backPath = await persist(_newPhotoBackFile, _photoBackPath);

    String? nv(TextEditingController c) =>
        c.text.trim().isEmpty ? null : c.text.trim();

    final companion = RestaurantsCompanion.insert(
      id: widget.restaurantId != null
          ? Value(widget.restaurantId!)
          : const Value.absent(),
      name: _nameCtrl.text.trim(),
      cardType: Value(_cardType),
      photoPath: Value(frontPath),
      photoBackPath: Value(backPath),
      phone: Value(nv(_phoneCtrl)),
      phone2: Value(nv(_phone2Ctrl)),
      email: Value(nv(_emailCtrl)),
      address: Value(nv(_addressCtrl)),
      website: Value(nv(_websiteCtrl)),
      socialLink: Value(nv(_socialCtrl)),
      tags: Value(_tags.join(',')),
    );

    await ref.read(databaseProvider).saveRestaurant(companion);
    if (mounted) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.restaurantId != null;

    return Scaffold(
      appBar: AppBar(
        title: Text(isEdit ? 'Editar tarjeta' : 'Nueva tarjeta'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // ── Tipo de tarjeta ─────────────────────────────────────────
            Text('Tipo', style: Theme.of(context).textTheme.labelLarge),
            const SizedBox(height: 8),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: kCardTypes.entries.map((e) {
                  final selected = _cardType == e.key;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      avatar: Icon(kCardTypeIcons[e.key],
                          size: 16,
                          color: selected
                              ? Theme.of(context).colorScheme.onSecondaryContainer
                              : null),
                      label: Text(e.value),
                      selected: selected,
                      onSelected: (_) => setState(() => _cardType = e.key),
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 16),

            // ── Fotos anverso / reverso ──────────────────────────────────
            Row(
              children: [
                Expanded(
                  child: _PhotoSlot(
                    label: 'Anverso',
                    file: _newPhotoFile,
                    savedPath: _photoPath,
                    ocrRunning: _ocrRunning,
                    onTap: () => _showPhotoOptions(true),
                    onReread: () {
                      final f = _newPhotoFile ??
                          (_photoPath != null ? File(_photoPath!) : null);
                      if (f != null) _runOcr([f]);
                    },
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _PhotoSlot(
                    label: 'Reverso',
                    file: _newPhotoBackFile,
                    savedPath: _photoBackPath,
                    ocrRunning: false,
                    onTap: () => _showPhotoOptions(false),
                    onReread: () {
                      final files = <File>[
                        if (_newPhotoFile != null) _newPhotoFile!
                        else if (_photoPath != null) File(_photoPath!),
                        if (_newPhotoBackFile != null) _newPhotoBackFile!
                        else if (_photoBackPath != null) File(_photoBackPath!),
                      ];
                      if (files.isNotEmpty) _runOcr(files);
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // ── Nombre ────────────────────────────────────────────────────
            TextFormField(
              controller: _nameCtrl,
              decoration: InputDecoration(
                labelText: 'Nombre *',
                border: const OutlineInputBorder(),
                prefixIcon: Icon(kCardTypeIcons[_cardType]),
              ),
              validator: (v) =>
                  v == null || v.trim().isEmpty ? 'El nombre es obligatorio' : null,
            ),
            const SizedBox(height: 12),

            // ── Contacto ──────────────────────────────────────────────────
            TextFormField(
              controller: _phoneCtrl,
              decoration: const InputDecoration(
                labelText: 'Teléfono 1',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.phone_outlined),
              ),
              keyboardType: TextInputType.phone,
            ),
            const SizedBox(height: 8),
            TextFormField(
              controller: _phone2Ctrl,
              decoration: const InputDecoration(
                labelText: 'Teléfono 2',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.phone_outlined),
              ),
              keyboardType: TextInputType.phone,
            ),
            const SizedBox(height: 8),
            TextFormField(
              controller: _emailCtrl,
              decoration: const InputDecoration(
                labelText: 'Email',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.email_outlined),
              ),
              keyboardType: TextInputType.emailAddress,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _addressCtrl,
              decoration: const InputDecoration(
                labelText: 'Dirección',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.location_on_outlined),
              ),
            ),
            const SizedBox(height: 8),
            TextFormField(
              controller: _websiteCtrl,
              decoration: const InputDecoration(
                labelText: 'Web',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.language_outlined),
              ),
              keyboardType: TextInputType.url,
            ),
            const SizedBox(height: 8),
            TextFormField(
              controller: _socialCtrl,
              decoration: const InputDecoration(
                labelText: 'Instagram',
                hintText: '@usuario o instagram.com/usuario',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.camera_alt_outlined),
              ),
            ),
            const SizedBox(height: 16),

            // ── Etiquetas ─────────────────────────────────────────────────
            Text('Etiquetas', style: Theme.of(context).textTheme.labelLarge),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _tagCtrl,
                    decoration: const InputDecoration(
                      hintText: 'Ej: favorito, vip…',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                    onFieldSubmitted: (_) => _addTag(),
                  ),
                ),
                const SizedBox(width: 8),
                FilledButton.tonal(
                    onPressed: _addTag, child: const Text('Añadir')),
              ],
            ),
            if (_tags.isNotEmpty) ...[
              const SizedBox(height: 8),
              Wrap(
                spacing: 6,
                children: _tags
                    .map((t) => TagChip(t,
                        onDeleted: () => setState(() => _tags.remove(t))))
                    .toList(),
              ),
            ],
            const SizedBox(height: 24),
            FilledButton(
              onPressed: _loading ? null : _save,
              child: _loading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2))
                  : Text(isEdit ? 'Guardar cambios' : 'Crear tarjeta'),
            ),
          ],
        ),
      ),
    );
  }
}

/// Ratio personalizado 2:3 (tarjeta vertical) para el menú de recorte.
class _PortraitPreset implements CropAspectRatioPresetData {
  const _PortraitPreset();

  @override
  String get name => 'Vertical (2:3)';

  @override
  (int, int)? get data => (2, 3);
}

class _PhotoSlot extends StatelessWidget {
  const _PhotoSlot({
    required this.label,
    required this.file,
    required this.savedPath,
    required this.ocrRunning,
    required this.onTap,
    required this.onReread,
  });
  final String label;
  final File? file;
  final String? savedPath;
  final bool ocrRunning;
  final VoidCallback onTap;
  final VoidCallback onReread;

  @override
  Widget build(BuildContext context) {
    final resolvedFile = file ?? (savedPath != null ? File(savedPath!) : null);
    final hasImage = resolvedFile != null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: Theme.of(context).textTheme.labelMedium),
        const SizedBox(height: 4),
        GestureDetector(
          onTap: onTap,
          child: Container(
            height: 130,
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(10),
              image: hasImage
                  ? DecorationImage(
                      image: FileImage(resolvedFile), fit: BoxFit.cover)
                  : null,
            ),
            child: ocrRunning
                ? const Center(child: CircularProgressIndicator())
                : hasImage
                    ? Stack(
                        children: [
                          Align(
                            alignment: Alignment.bottomRight,
                            child: Padding(
                              padding: const EdgeInsets.all(6),
                              child: CircleAvatar(
                                radius: 14,
                                backgroundColor: Colors.black54,
                                child: IconButton(
                                  icon: const Icon(Icons.edit,
                                      color: Colors.white, size: 14),
                                  onPressed: onTap,
                                ),
                              ),
                            ),
                          ),
                          Align(
                            alignment: Alignment.bottomLeft,
                            child: Padding(
                              padding: const EdgeInsets.all(6),
                              child: ActionChip(
                                avatar: const Icon(Icons.document_scanner,
                                    size: 13),
                                label: const Text('OCR',
                                    style: TextStyle(fontSize: 11)),
                                backgroundColor: Colors.black54,
                                labelStyle:
                                    const TextStyle(color: Colors.white),
                                padding: EdgeInsets.zero,
                                onPressed: onReread,
                              ),
                            ),
                          ),
                        ],
                      )
                    : Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.add_a_photo_outlined,
                                color: Theme.of(context).colorScheme.outline),
                            const SizedBox(height: 4),
                            Text('Añadir foto',
                                style: TextStyle(
                                    fontSize: 11,
                                    color:
                                        Theme.of(context).colorScheme.outline)),
                          ],
                        ),
                      ),
          ),
        ),
      ],
    );
  }
}
