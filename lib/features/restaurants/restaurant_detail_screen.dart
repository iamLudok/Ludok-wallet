import 'dart:io';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/theme.dart';
import '../../core/widgets.dart';
import '../../data/database.dart';
import '../../data/providers.dart';
import 'restaurant_form_screen.dart';

class RestaurantDetailScreen extends ConsumerWidget {
  const RestaurantDetailScreen(this.restaurantId, {super.key});
  final int restaurantId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncList = ref.watch(restaurantsProvider);
    return asyncList.when(
      loading: () =>
          const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (e, _) => Scaffold(body: Center(child: Text('Error: $e'))),
      data: (list) {
        final r = list.where((r) => r.id == restaurantId).firstOrNull;
        if (r == null) {
          return const Scaffold(
              body: Center(child: Text('Tarjeta no encontrada')));
        }
        return _DetailView(r);
      },
    );
  }
}

class _DetailView extends ConsumerStatefulWidget {
  const _DetailView(this.r);
  final Restaurant r;

  @override
  ConsumerState<_DetailView> createState() => _DetailViewState();
}

class _DetailViewState extends ConsumerState<_DetailView>
    with SingleTickerProviderStateMixin {
  late final AnimationController _flipCtrl;
  late final Animation<double> _flipAnim;

  @override
  void initState() {
    super.initState();
    _flipCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 400));
    _flipAnim = CurvedAnimation(parent: _flipCtrl, curve: Curves.easeInOut);
  }

  @override
  void dispose() {
    _flipCtrl.dispose();
    super.dispose();
  }

  void _flip() {
    _flipCtrl.isCompleted ? _flipCtrl.reverse() : _flipCtrl.forward();
  }

  Future<void> _delete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Eliminar tarjeta'),
        content: const Text('¿Seguro que quieres eliminar esta tarjeta?'),
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
      await ref.read(databaseProvider).deleteRestaurant(widget.r.id);
      if (mounted) Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    final r = widget.r;
    final tags = r.tags
        .split(',')
        .map((t) => t.trim())
        .where((t) => t.isNotEmpty)
        .toList();
    final hasFront = r.photoPath != null && r.photoPath!.isNotEmpty;
    final hasBack = r.photoBackPath != null && r.photoBackPath!.isNotEmpty;

    return Scaffold(
      appBar: AppBar(
        title: Text(r.name),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            onPressed: () => Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                  builder: (_) => RestaurantFormScreen(restaurantId: r.id)),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.delete_outline),
            onPressed: _delete,
          ),
        ],
      ),
      body: ListView(
        children: [
          // ── Foto con flip ───────────────────────────────────────────
          GestureDetector(
            onTap: (hasFront && hasBack) ? _flip : null,
            child: AnimatedBuilder(
              animation: _flipAnim,
              builder: (_, _) {
                final angle = _flipAnim.value * pi;
                final isFront = angle < pi / 2;
                Widget face;

                if (isFront) {
                  face = hasFront
                      ? _CardPhoto(r.photoPath!)
                      : _CardPlaceholder(r.cardType);
                } else {
                  face = Transform(
                    transform: Matrix4.identity()..rotateY(pi),
                    alignment: Alignment.center,
                    child: hasBack
                        ? _CardPhoto(r.photoBackPath!)
                        : _CardPlaceholder(r.cardType),
                  );
                }

                return Stack(
                  children: [
                    Transform(
                      transform: Matrix4.identity()
                        ..setEntry(3, 2, 0.001)
                        ..rotateY(angle),
                      alignment: Alignment.center,
                      child: face,
                    ),
                    if (hasFront && hasBack)
                      Positioned(
                        bottom: 8,
                        right: 12,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.black54,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.flip, size: 14, color: Colors.white),
                              const SizedBox(width: 4),
                              Text(
                                isFront ? 'Toca para ver reverso' : 'Toca para ver anverso',
                                style: const TextStyle(
                                    color: Colors.white, fontSize: 11),
                              ),
                            ],
                          ),
                        ),
                      ),
                  ],
                );
              },
            ),
          ),

          // ── Datos ───────────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(kCardTypeIcons[r.cardType] ?? Icons.credit_card,
                        color: Theme.of(context).colorScheme.primary, size: 20),
                    const SizedBox(width: 6),
                    Text(
                      kCardTypes[r.cardType] ?? 'Otro',
                      style: TextStyle(
                          color: Theme.of(context).colorScheme.primary,
                          fontSize: 13),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(r.name,
                    style: Theme.of(context).textTheme.headlineSmall),
                if (tags.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Wrap(
                      spacing: 6,
                      children: tags.map((t) => TagChip(t)).toList()),
                ],
                const SizedBox(height: 16),
                if (r.phone != null && r.phone!.isNotEmpty)
                  _ActionTile(
                    icon: Icons.phone_outlined,
                    text: r.phone!,
                    onTap: () => launchUrl(Uri.parse('tel:${r.phone}')),
                  ),
                if (r.phone2 != null && r.phone2!.isNotEmpty)
                  _ActionTile(
                    icon: Icons.phone_outlined,
                    text: r.phone2!,
                    onTap: () => launchUrl(Uri.parse('tel:${r.phone2}')),
                  ),
                if (r.email != null && r.email!.isNotEmpty)
                  _ActionTile(
                    icon: Icons.email_outlined,
                    text: r.email!,
                    onTap: () =>
                        launchUrl(Uri.parse('mailto:${r.email}')),
                  ),
                if (r.address != null && r.address!.isNotEmpty)
                  _ActionTile(
                    icon: Icons.location_on_outlined,
                    text: r.address!,
                    onTap: () async {
                      final q = Uri.encodeComponent(r.address!);
                      final uri = Uri.parse('geo:0,0?q=$q');
                      if (!await launchUrl(uri)) {
                        await launchUrl(
                            Uri.parse('https://maps.google.com/?q=$q'));
                      }
                    },
                  ),
                if (r.website != null && r.website!.isNotEmpty)
                  _ActionTile(
                    icon: Icons.language_outlined,
                    text: r.website!,
                    onTap: () {
                      final raw = r.website!;
                      final url =
                          raw.startsWith('http') ? raw : 'https://$raw';
                      launchUrl(Uri.parse(url),
                          mode: LaunchMode.externalApplication);
                    },
                  ),
                if (r.socialLink != null && r.socialLink!.isNotEmpty)
                  _ActionTile(
                    icon: Icons.camera_alt_outlined,
                    text: _igDisplayName(r.socialLink!),
                    onTap: () => _openInstagram(r.socialLink!),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Extrae el nombre de usuario de cualquier forma que el usuario haya introducido.
String _igUsername(String raw) => raw
    .replaceAll(RegExp(r'https?://(www\.)?instagram\.com/', caseSensitive: false), '')
    .replaceAll('@', '')
    .split('?').first
    .split('/').first
    .trim();

String _igDisplayName(String raw) {
  final u = _igUsername(raw);
  return u.isNotEmpty ? '@$u' : raw;
}

Future<void> _openInstagram(String raw) async {
  final username = _igUsername(raw);
  if (username.isEmpty) return;
  final appUri = Uri.parse('instagram://user?username=$username');
  if (!await launchUrl(appUri)) {
    await launchUrl(
      Uri.parse('https://www.instagram.com/$username/'),
      mode: LaunchMode.externalApplication,
    );
  }
}

/// Foto de la tarjeta a tamaño completo, adaptada a cualquier orientación.
class _CardPhoto extends StatelessWidget {
  const _CardPhoto(this.path);
  final String path;

  @override
  Widget build(BuildContext context) {
    return Image.file(
      File(path),
      width: double.infinity,
      fit: BoxFit.fitWidth,
    );
  }
}

class _CardPlaceholder extends StatelessWidget {
  const _CardPlaceholder(this.cardType);
  final String cardType;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 200,
      width: double.infinity,
      color: Theme.of(context).colorScheme.surfaceContainerHighest,
      child: Center(
        child: Icon(
          kCardTypeIcons[cardType] ?? Icons.credit_card,
          size: 72,
          color: Theme.of(context).colorScheme.outline,
        ),
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  const _ActionTile(
      {required this.icon, required this.text, required this.onTap});
  final IconData icon;
  final String text;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Icon(icon, color: Theme.of(context).colorScheme.primary),
      title: Text(text),
      onTap: onTap,
    );
  }
}
