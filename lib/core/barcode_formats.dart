import 'package:barcode_widget/barcode_widget.dart' as bw;
import 'package:mobile_scanner/mobile_scanner.dart';

const Map<String, String> kSelectableFormats = {
  'qrCode': 'QR',
  'code128': 'Código de barras (Code 128)',
  'ean13': 'EAN-13',
  'code39': 'Code 39',
  'pdf417': 'PDF417',
  'aztec': 'Aztec',
};

String formatKeyFromScanner(BarcodeFormat format) => format.name;

bw.Barcode barcodeForFormat(String formatKey) {
  switch (formatKey) {
    case 'code128':    return bw.Barcode.code128();
    case 'ean13':      return bw.Barcode.ean13();
    case 'ean8':       return bw.Barcode.ean8();
    case 'code39':     return bw.Barcode.code39();
    case 'code93':     return bw.Barcode.code93();
    case 'codabar':    return bw.Barcode.codabar();
    case 'itf':        return bw.Barcode.itf();
    case 'upcA':       return bw.Barcode.upcA();
    case 'upcE':       return bw.Barcode.upcE();
    case 'pdf417':     return bw.Barcode.pdf417();
    case 'aztec':      return bw.Barcode.aztec();
    case 'dataMatrix': return bw.Barcode.dataMatrix();
    case 'qrCode':
    default:           return bw.Barcode.qrCode();
  }
}

bool isTwoDimensional(String formatKey) =>
    const {'qrCode', 'aztec', 'dataMatrix', 'pdf417'}.contains(formatKey);
