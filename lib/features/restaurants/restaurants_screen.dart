import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme.dart';
import '../../core/widgets.dart';
import '../../data/database.dart';
import '../../data/providers.dart';
import 'restaurant_detail_screen.dart';
import 'restaurant_form_screen.dart';

final _selectedTypeProvider =
    NotifierProvider<_TypeNotifier, String?>(_TypeNotifier.new);

class _TypeNotifier extends Notifier<String?> {
  @override
  String? build() => null;
  void select(String? type) => state = type;
}

class RestaurantsScreen extends ConsumerWidget {
  const RestaurantsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncList = ref.watch(restaurantsProvider);
    final selectedType = ref.watch(_selectedTypeProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Tarjetas'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: _TypeFilter(selected: selectedType),
        ),
      ),
      body: asyncList.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (all) {
          final list = selectedType == null
              ? all
              : all.where((r) => r.cardType == selectedType).toList();

          if (list.isEmpty) {
            return EmptyState(
              icon: selectedType != null
                  ? (kCardTypeIcons[selectedType] ?? Icons.credit_card)
                  : Icons.credit_card,
              title: 'Sin tarjetas',
              subtitle: 'Pulsa + para guardar tu primera tarjeta.',
            );
          }
          return GridView.builder(
            padding: const EdgeInsets.all(12),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 0.82,
            ),
            itemCount: list.length,
            itemBuilder: (_, i) => _CardTile(list[i]),
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const RestaurantFormScreen()),
        ),
        child: const Icon(Icons.add),
      ),
    );
  }
}

class _TypeFilter extends ConsumerWidget {
  const _TypeFilter({required this.selected});
  final String? selected;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return SizedBox(
      height: 48,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        children: [
          ChoiceChip(
            label: const Text('Todas'),
            selected: selected == null,
            onSelected: (_) =>
                ref.read(_selectedTypeProvider.notifier).select(null),
          ),
          const SizedBox(width: 8),
          ...kCardTypes.entries.map(
            (e) => Padding(
              padding: const EdgeInsets.only(right: 8),
              child: ChoiceChip(
                avatar: Icon(kCardTypeIcons[e.key], size: 14),
                label: Text(e.value),
                selected: selected == e.key,
                onSelected: (_) => ref
                    .read(_selectedTypeProvider.notifier)
                    .select(selected == e.key ? null : e.key),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _CardTile extends StatelessWidget {
  const _CardTile(this.restaurant);
  final Restaurant restaurant;

  @override
  Widget build(BuildContext context) {
    final r = restaurant;
    final hasFront = r.photoPath != null && r.photoPath!.isNotEmpty;
    final tags = r.tags
        .split(',')
        .map((t) => t.trim())
        .where((t) => t.isNotEmpty)
        .toList();

    return Card(
      child: InkWell(
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(
              builder: (_) => RestaurantDetailScreen(r.id)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: hasFront
                  ? Image.file(File(r.photoPath!),
                      width: double.infinity, fit: BoxFit.cover)
                  : Container(
                      width: double.infinity,
                      color: Theme.of(context)
                          .colorScheme
                          .surfaceContainerHighest,
                      child: Icon(
                        kCardTypeIcons[r.cardType] ?? Icons.credit_card,
                        size: 48,
                        color: Theme.of(context).colorScheme.outline,
                      ),
                    ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 6, 8, 2),
              child: Text(r.name,
                  style: Theme.of(context).textTheme.titleSmall,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(6, 0, 6, 6),
              child: tags.isNotEmpty
                  ? Wrap(
                      spacing: 4,
                      children: tags.take(2).map((t) => TagChip(t)).toList(),
                    )
                  : Text(kCardTypes[r.cardType] ?? 'Otro',
                      style: TextStyle(
                          fontSize: 11,
                          color: Theme.of(context).colorScheme.outline)),
            ),
          ],
        ),
      ),
    );
  }
}
