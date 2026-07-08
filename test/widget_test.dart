import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:ludovis/main.dart';

void main() {
  testWidgets('App arranca sin errores', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: LudovisApp()));
    await tester.pump();
    expect(find.text('Restaurantes'), findsOneWidget);
  });
}
