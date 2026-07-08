import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../core/widgets.dart';
import '../../data/database.dart';
import '../../data/providers.dart';
import 'ticket_detail_screen.dart';
import 'ticket_form_screen.dart';

class TicketsScreen extends ConsumerWidget {
  const TicketsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncList = ref.watch(ticketsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Entradas')),
      body: asyncList.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (list) {
          if (list.isEmpty) {
            return const EmptyState(
              icon: Icons.confirmation_number,
              title: 'Sin entradas',
              subtitle:
                  'Pulsa + para guardar una entrada de concierto, teatro, deporte…',
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.symmetric(vertical: 8),
            itemCount: list.length,
            separatorBuilder: (_, _) => const SizedBox(height: 4),
            itemBuilder: (_, i) => _TicketTile(list[i]),
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const TicketFormScreen()),
        ),
        child: const Icon(Icons.add),
      ),
    );
  }
}

class _TicketTile extends StatelessWidget {
  const _TicketTile(this.ticket);
  final Ticket ticket;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final dateStr = ticket.eventDateTime == null
        ? null
        : DateFormat('EEE d MMM yyyy · HH:mm', 'es').format(ticket.eventDateTime!);

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: cs.primaryContainer,
          child: Icon(Icons.confirmation_number, color: cs.onPrimaryContainer),
        ),
        title: Text(ticket.title, maxLines: 1, overflow: TextOverflow.ellipsis),
        subtitle: Text(
          [ticket.venue, dateStr]
              .whereType<String>()
              .where((s) => s.isNotEmpty)
              .join(' · '),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        trailing: const Icon(Icons.chevron_right),
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => TicketDetailScreen(ticket.id)),
        ),
      ),
    );
  }
}
