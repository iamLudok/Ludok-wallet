import 'dart:io';

import 'package:barcode_widget/barcode_widget.dart' as bw;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:screen_brightness/screen_brightness.dart';

import '../../core/barcode_formats.dart';
import '../../data/database.dart';
import '../../data/providers.dart';
import 'ticket_form_screen.dart';

class TicketDetailScreen extends ConsumerWidget {
  const TicketDetailScreen(this.ticketId, {super.key});
  final int ticketId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncList = ref.watch(ticketsProvider);
    return asyncList.when(
      loading: () =>
          const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (e, _) => Scaffold(body: Center(child: Text('Error: $e'))),
      data: (list) {
        final t = list.where((t) => t.id == ticketId).firstOrNull;
        if (t == null) {
          return const Scaffold(
              body: Center(child: Text('Entrada no encontrada')));
        }
        return _DetailView(t);
      },
    );
  }
}

class _DetailView extends ConsumerStatefulWidget {
  const _DetailView(this.ticket);
  final Ticket ticket;

  @override
  ConsumerState<_DetailView> createState() => _DetailViewState();
}

class _DetailViewState extends ConsumerState<_DetailView> {
  bool _fullscreen = false;
  double? _originalBrightness;

  Future<void> _enterFullscreen() async {
    _originalBrightness = await ScreenBrightness().application;
    await ScreenBrightness().setApplicationScreenBrightness(1.0);
    await SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    setState(() => _fullscreen = true);
  }

  Future<void> _exitFullscreen() async {
    await SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    if (_originalBrightness != null) {
      await ScreenBrightness()
          .setApplicationScreenBrightness(_originalBrightness!);
    }
    setState(() => _fullscreen = false);
  }

  Future<void> _delete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Eliminar entrada'),
        content: const Text('¿Seguro que quieres eliminar esta entrada?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancelar')),
          FilledButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Eliminar')),
        ],
      ),
    );
    if (confirmed == true && mounted) {
      await ref.read(databaseProvider).deleteTicket(widget.ticket.id);
      if (mounted) Navigator.pop(context);
    }
  }

  @override
  void dispose() {
    // Restaurar siempre al salir, aunque no haya entrado en fullscreen.
    if (_fullscreen) {
      SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
      if (_originalBrightness != null) {
        ScreenBrightness()
            .setApplicationScreenBrightness(_originalBrightness!);
      }
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_fullscreen) return _FullscreenCode(widget.ticket, _exitFullscreen);

    final t = widget.ticket;
    final dateStr = t.eventDateTime == null
        ? null
        : DateFormat('EEE d MMM yyyy · HH:mm', 'es').format(t.eventDateTime!);
    final hasImage = t.imagePath != null && t.imagePath!.isNotEmpty;

    return Scaffold(
      appBar: AppBar(
        title: Text(t.title, maxLines: 1, overflow: TextOverflow.ellipsis),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            onPressed: () => Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                  builder: (_) => TicketFormScreen(ticketId: t.id)),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.delete_outline),
            onPressed: _delete,
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (t.venue != null && t.venue!.isNotEmpty)
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Icon(Icons.location_on_outlined,
                  color: Theme.of(context).colorScheme.primary),
              title: Text(t.venue!),
            ),
          if (dateStr != null)
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Icon(Icons.calendar_today,
                  color: Theme.of(context).colorScheme.primary),
              title: Text(dateStr),
            ),
          const SizedBox(height: 12),

          // Vista previa del código + botón para pantalla completa
          Card(
            child: InkWell(
              onTap: _enterFullscreen,
              borderRadius: BorderRadius.circular(12),
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    _CodeWidget(t, maxHeight: 220),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.fullscreen,
                            color: Theme.of(context).colorScheme.primary),
                        const SizedBox(width: 6),
                        Text(
                          'Toca para mostrar a pantalla completa',
                          style: TextStyle(
                              color: Theme.of(context).colorScheme.primary),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),

          if (hasImage) ...[
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.file(File(t.imagePath!), fit: BoxFit.contain),
            ),
          ],

          if (t.notes != null && t.notes!.isNotEmpty) ...[
            const SizedBox(height: 12),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Icon(Icons.notes,
                  color: Theme.of(context).colorScheme.primary),
              title: Text(t.notes!),
            ),
          ],
        ],
      ),
    );
  }
}

/// Pantalla completa con el código a máximo tamaño y brillo.
class _FullscreenCode extends StatelessWidget {
  const _FullscreenCode(this.ticket, this.onClose);
  final Ticket ticket;
  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onClose,
      child: Scaffold(
        backgroundColor: Colors.white,
        body: SafeArea(
          child: Stack(
            children: [
              Center(child: _CodeWidget(ticket)),
              Positioned(
                top: 8,
                right: 8,
                child: IconButton(
                  icon: const Icon(Icons.fullscreen_exit, color: Colors.black54),
                  onPressed: onClose,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Renderiza el código QR o de barras según el formato guardado.
class _CodeWidget extends StatelessWidget {
  const _CodeWidget(this.ticket, {this.maxHeight});
  final Ticket ticket;
  final double? maxHeight;

  @override
  Widget build(BuildContext context) {
    final is2D = isTwoDimensional(ticket.codeFormat);
    final barcode = barcodeForFormat(ticket.codeFormat);
    final size = maxHeight ?? (MediaQuery.of(context).size.shortestSide * 0.7);

    return bw.BarcodeWidget(
      data: ticket.codeData,
      barcode: barcode,
      width: is2D ? size : size * 1.8,
      height: size,
      color: Colors.black,
      backgroundColor: Colors.white,
      errorBuilder: (_, err) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.error_outline, color: Colors.red, size: 40),
          const SizedBox(height: 8),
          Text('Código no válido para este formato',
              style: TextStyle(color: Colors.red.shade700)),
          const SizedBox(height: 4),
          const Text('Prueba a cambiar el formato en editar',
              style: TextStyle(fontSize: 12, color: Colors.grey)),
        ],
      ),
    );
  }
}
