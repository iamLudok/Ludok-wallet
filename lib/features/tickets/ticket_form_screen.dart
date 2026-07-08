import 'dart:io';

import 'package:drift/drift.dart' show Value;
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:pdfx/pdfx.dart';

import '../../core/barcode_formats.dart';
import '../../core/ocr_parser.dart';
import '../../data/database.dart';
import '../../data/image_storage.dart';
import '../../data/providers.dart';
import 'ticket_scanner_screen.dart';

class TicketFormScreen extends ConsumerStatefulWidget {
  const TicketFormScreen({super.key, this.ticketId});
  final int? ticketId;

  @override
  ConsumerState<TicketFormScreen> createState() => _TicketFormScreenState();
}

class _TicketFormScreenState extends ConsumerState<TicketFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleCtrl = TextEditingController();
  final _venueCtrl = TextEditingController();
  final _codeCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();

  String _codeFormat = 'qrCode';
  DateTime? _eventDateTime;
  String? _imagePath;
  File? _newImageFile;
  bool _loading = false;
  bool _pdfScanning = false;
  bool _ocrRunning = false;

  @override
  void initState() {
    super.initState();
    if (widget.ticketId != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _loadExisting());
    }
  }

  void _loadExisting() {
    final list = ref.read(ticketsProvider).asData?.value ?? [];
    final t = list.where((t) => t.id == widget.ticketId).firstOrNull;
    if (t == null) return;
    _titleCtrl.text = t.title;
    _venueCtrl.text = t.venue ?? '';
    _codeCtrl.text = t.codeData;
    _notesCtrl.text = t.notes ?? '';
    _codeFormat = t.codeFormat;
    _eventDateTime = t.eventDateTime;
    _imagePath = t.imagePath;
    setState(() {});
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _venueCtrl.dispose();
    _codeCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _runTicketOcr() async {
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      builder: (_) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('Sacar foto al billete'),
              onTap: () => Navigator.pop(context, ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Elegir imagen de la galería'),
              onTap: () => Navigator.pop(context, ImageSource.gallery),
            ),
          ],
        ),
      ),
    );
    if (source == null || !mounted) return;

    final picker = ImagePicker();
    final picked =
        await picker.pickImage(source: source, imageQuality: 85, maxWidth: 1400);
    if (picked == null || !mounted) return;

    setState(() => _ocrRunning = true);
    final recognizer = TextRecognizer(script: TextRecognitionScript.latin);
    try {
      final recognized =
          await recognizer.processImage(InputImage.fromFilePath(picked.path));
      final result = parseTicketOcrText(recognized.text);

      if (!mounted) return;
      final filled = result.title != null && _titleCtrl.text.isEmpty;
      if (filled) _titleCtrl.text = result.title!;
      setState(() {});

      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(filled
            ? 'Título detectado. Corrígelo si es necesario.'
            : 'No se detectó el título en la imagen.'),
        duration: const Duration(seconds: 3),
      ));
    } finally {
      await recognizer.close();
      if (mounted) setState(() => _ocrRunning = false);
    }
  }

  Future<void> _scan() async {
    final result = await Navigator.push<Map<String, String>>(
      context,
      MaterialPageRoute(builder: (_) => const TicketScannerScreen()),
    );
    if (result == null) return;
    setState(() {
      _codeCtrl.text = result['data']!;
      _codeFormat = result['format']!;
    });
  }

  /// Importa desde PDF: renderiza cada página y busca un código QR/barras.
  Future<void> _importFromPdf() async {
    final result = await FilePicker.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf'],
    );
    if (result == null || result.files.single.path == null) return;

    setState(() => _pdfScanning = true);

    try {
      final pdfPath = result.files.single.path!;
      final doc = await PdfDocument.openFile(pdfPath);
      final tmpDir = await getTemporaryDirectory();

      BarcodeCapture? found;
      File? pageImageFile;
      final controller = MobileScannerController();

      for (int pageNum = 1; pageNum <= doc.pagesCount; pageNum++) {
        final page = await doc.getPage(pageNum);
        final pageImage = await page.render(
          width: page.width * 2,
          height: page.height * 2,
          format: PdfPageImageFormat.jpeg,
        );
        await page.close();
        if (pageImage == null) continue;

        final imgFile =
            File(p.join(tmpDir.path, 'pdf_page_$pageNum.jpg'));
        await imgFile.writeAsBytes(pageImage.bytes);
        pageImageFile = imgFile;

        final capture = await controller.analyzeImage(imgFile.path);
        if (capture != null && capture.barcodes.isNotEmpty) {
          found = capture;
          break;
        }
      }

      controller.dispose();
      await doc.close();

      if (!mounted) return;

      if (found != null) {
        final barcode = found.barcodes.first;
        setState(() {
          _codeCtrl.text = barcode.rawValue ?? '';
          _codeFormat = formatKeyFromScanner(barcode.format);
          if (pageImageFile != null) _newImageFile = pageImageFile;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Código detectado ($_codeFormat). Buscando más datos…'),
            duration: const Duration(seconds: 2),
          ),
        );
        // OCR en la misma página para intentar detectar el título
        if (pageImageFile != null && _titleCtrl.text.isEmpty) {
          final recognizer = TextRecognizer(script: TextRecognitionScript.latin);
          try {
            final rec = await recognizer.processImage(
                InputImage.fromFilePath(pageImageFile.path));
            final ocrResult = parseTicketOcrText(rec.text);
            if (mounted && ocrResult.title != null) {
              _titleCtrl.text = ocrResult.title!;
            }
          } finally {
            await recognizer.close();
          }
        }
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
                'No se encontró ningún código QR o de barras en el PDF.'),
            duration: Duration(seconds: 4),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al leer el PDF: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _pdfScanning = false);
    }
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(
        source: ImageSource.gallery, imageQuality: 85, maxWidth: 1200);
    if (picked == null) return;
    setState(() => _newImageFile = File(picked.path));
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: _eventDateTime ?? now,
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );
    if (date == null || !mounted) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(_eventDateTime ?? now),
    );
    if (time == null) return;
    setState(() {
      _eventDateTime =
          DateTime(date.year, date.month, date.day, time.hour, time.minute);
    });
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);

    String? savedImagePath = _imagePath;
    if (_newImageFile != null) {
      if (_imagePath != null) await ImageStorage.deleteIfExists(_imagePath);
      savedImagePath = await ImageStorage.saveImage(_newImageFile!);
    }

    final companion = TicketsCompanion.insert(
      id: widget.ticketId != null
          ? Value(widget.ticketId!)
          : const Value.absent(),
      title: _titleCtrl.text.trim(),
      venue: Value(
          _venueCtrl.text.trim().isEmpty ? null : _venueCtrl.text.trim()),
      codeData: _codeCtrl.text.trim(),
      codeFormat: Value(_codeFormat),
      eventDateTime: Value(_eventDateTime),
      imagePath: Value(savedImagePath),
      notes: Value(
          _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim()),
      price: const Value(null),
    );

    await ref.read(databaseProvider).saveTicket(companion);
    if (mounted) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.ticketId != null;
    final dateLabel = _eventDateTime == null
        ? 'Seleccionar fecha y hora'
        : DateFormat('EEE d MMM yyyy · HH:mm', 'es').format(_eventDateTime!);

    return Scaffold(
      appBar: AppBar(title: Text(isEdit ? 'Editar entrada' : 'Nueva entrada')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // ── OCR de datos del billete ─────────────────────────────
            OutlinedButton.icon(
              icon: _ocrRunning
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.document_scanner_outlined),
              label: Text(_ocrRunning
                  ? 'Leyendo datos del billete…'
                  : 'Leer datos del billete (OCR)'),
              onPressed: _ocrRunning ? null : _runTicketOcr,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _titleCtrl,
              decoration: const InputDecoration(
                labelText: 'Título del evento *',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.event),
              ),
              validator: (v) => v == null || v.trim().isEmpty
                  ? 'El título es obligatorio'
                  : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _venueCtrl,
              decoration: const InputDecoration(
                labelText: 'Lugar',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.location_on_outlined),
              ),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              icon: const Icon(Icons.calendar_today_outlined),
              label: Text(dateLabel),
              onPressed: _pickDate,
            ),
            const SizedBox(height: 16),
            const Divider(),
            const SizedBox(height: 8),
            Text('Código escaneable',
                style: Theme.of(context).textTheme.labelLarge),
            const SizedBox(height: 8),

            // --- Importar desde PDF ---
            FilledButton.icon(
              icon: _pdfScanning
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.picture_as_pdf),
              label: Text(_pdfScanning
                  ? 'Buscando código en el PDF…'
                  : 'Importar desde PDF'),
              onPressed: _pdfScanning ? null : _importFromPdf,
              style: FilledButton.styleFrom(
                backgroundColor: Theme.of(context).colorScheme.secondary,
              ),
            ),
            const SizedBox(height: 8),

            // --- Escanear con cámara ---
            FilledButton.icon(
              icon: const Icon(Icons.qr_code_scanner),
              label: const Text('Escanear con la cámara'),
              onPressed: _scan,
            ),
            const SizedBox(height: 8),
            Row(
              children: const [
                Expanded(child: Divider()),
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 8),
                  child: Text('o escribe el código'),
                ),
                Expanded(child: Divider()),
              ],
            ),
            const SizedBox(height: 8),
            TextFormField(
              controller: _codeCtrl,
              decoration: const InputDecoration(
                labelText: 'Valor del código *',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.data_array),
              ),
              validator: (v) => v == null || v.trim().isEmpty
                  ? 'El código es obligatorio'
                  : null,
            ),
            const SizedBox(height: 8),
            InputDecorator(
              decoration: const InputDecoration(
                labelText: 'Formato',
                border: OutlineInputBorder(),
                isDense: true,
                contentPadding:
                    EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _codeFormat,
                  isDense: true,
                  isExpanded: true,
                  items: kSelectableFormats.entries
                      .map((e) =>
                          DropdownMenuItem(value: e.key, child: Text(e.value)))
                      .toList(),
                  onChanged: (v) => setState(() => _codeFormat = v!),
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Divider(),
            const SizedBox(height: 8),
            Text('Imagen de la entrada (opcional)',
                style: Theme.of(context).textTheme.labelLarge),
            const SizedBox(height: 8),
            _ImagePickerWidget(
              imageFile: _newImageFile,
              imagePath: _imagePath,
              onTap: _pickImage,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _notesCtrl,
              decoration: const InputDecoration(
                labelText: 'Notas',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.notes),
              ),
              maxLines: 2,
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: _loading ? null : _save,
              child: _loading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2))
                  : Text(isEdit ? 'Guardar cambios' : 'Guardar entrada'),
            ),
          ],
        ),
      ),
    );
  }
}

class _ImagePickerWidget extends StatelessWidget {
  const _ImagePickerWidget(
      {required this.imageFile, required this.imagePath, required this.onTap});
  final File? imageFile;
  final String? imagePath;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final file = imageFile ?? (imagePath != null ? File(imagePath!) : null);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 120,
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(8),
          image: file != null
              ? DecorationImage(image: FileImage(file), fit: BoxFit.cover)
              : null,
        ),
        child: file == null
            ? Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.image_outlined,
                        size: 36,
                        color: Theme.of(context).colorScheme.outline),
                    const SizedBox(height: 4),
                    Text('Añadir imagen de la entrada',
                        style: TextStyle(
                            color: Theme.of(context).colorScheme.outline)),
                  ],
                ),
              )
            : Align(
                alignment: Alignment.bottomRight,
                child: Padding(
                  padding: const EdgeInsets.all(6),
                  child: CircleAvatar(
                    radius: 14,
                    backgroundColor: Colors.black54,
                    child: const Icon(Icons.edit, size: 14, color: Colors.white),
                  ),
                ),
              ),
      ),
    );
  }
}
