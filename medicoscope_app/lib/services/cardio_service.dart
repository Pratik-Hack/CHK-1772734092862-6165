import 'package:medicoscope/models/cardio_result.dart';
import 'package:medicoscope/services/heart_inference_service.dart';

class CardioService {
  /// Predict heart condition from audio file using on-device TFLite model.
  /// Fully offline — no network required.
  static Future<CardioResult> predict(String filePath) async {
    // Validate file format
    final lower = filePath.toLowerCase();
    if (!lower.endsWith('.wav')) {
      throw Exception(
        'Only WAV audio files are supported for offline analysis. '
        'Please record or select a .wav file.',
      );
    }

    try {
      return await HeartInferenceService.predict(filePath);
    } on FormatException catch (e) {
      throw Exception('Invalid audio file format: ${e.message}');
    } catch (e) {
      final msg = e.toString().replaceFirst('Exception: ', '');
      if (msg.contains('Invalid WAV')) {
        throw Exception(
          'Could not read the audio file. Please ensure it is a valid WAV recording.',
        );
      }
      if (msg.contains('Model') || msg.contains('Interpreter')) {
        throw Exception(
          'Heart model failed to load. Please restart the app and try again.',
        );
      }
      throw Exception('Heart sound analysis failed: $msg');
    }
  }
}
