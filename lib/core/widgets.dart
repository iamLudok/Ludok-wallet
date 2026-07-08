import 'package:flutter/material.dart';

import 'theme.dart';

/// Chip de etiqueta con color derivado del texto.
class TagChip extends StatelessWidget {
  const TagChip(this.tag, {super.key, this.onDeleted});
  final String tag;
  final VoidCallback? onDeleted;

  @override
  Widget build(BuildContext context) {
    final color = colorForTag(tag);
    return Chip(
      label: Text(tag, style: const TextStyle(fontSize: 11, color: Colors.white)),
      backgroundColor: color,
      deleteIconColor: Colors.white,
      onDeleted: onDeleted,
      padding: const EdgeInsets.symmetric(horizontal: 4),
      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
    );
  }
}

/// Pantalla vacía con icono, título y subtítulo.
class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
  });
  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 64, color: cs.outlineVariant),
            const SizedBox(height: 16),
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Text(
              subtitle,
              style: Theme.of(context).textTheme.bodySmall,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
