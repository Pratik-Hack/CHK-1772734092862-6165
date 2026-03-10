import 'dart:typed_data';
import 'package:medicoscope/models/detection_result.dart';

/// Stub implementation for web platform where TFLite is not available.
/// Actual inference is handled server-side in TFLiteService.
class TFLiteMobileService {
  int inputSize = 416;

  Future<void> loadModel(String category) async {
    // No-op on web — inference is done server-side
  }

  Future<DetectionResult?> runInferenceFromBytes(Uint8List imageBytes) async {
    // Should never be called on web
    throw UnsupportedError('TFLite inference is not supported on web');
  }

  void dispose() {
    // No-op on web
  }
}
