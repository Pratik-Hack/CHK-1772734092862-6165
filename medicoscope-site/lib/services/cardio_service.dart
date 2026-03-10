import 'dart:convert';
import 'dart:typed_data';
import 'package:http/http.dart' as http;
import 'package:medicoscope/core/constants/api_constants.dart';
import 'package:medicoscope/models/cardio_result.dart';

class CardioService {
  /// Predict from file path (mobile)
  static Future<CardioResult> predict(String filePath) async {
    final url = Uri.parse(
      '${ApiConstants.cardioBaseUrl}${ApiConstants.cardioPredict}',
    );

    final request = http.MultipartRequest('POST', url)
      ..files.add(await http.MultipartFile.fromPath(
        'audio_file',
        filePath,
        filename: 'heart_sound.wav',
      ));

    final streamedResponse = await request.send().timeout(
      const Duration(seconds: 120),
    );
    final response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return CardioResult.fromJson(data);
    } else if (response.statusCode == 503) {
      throw Exception('Service is warming up. Please try again in a moment.');
    } else {
      throw Exception('Heart sound analysis failed: ${response.statusCode}');
    }
  }

  /// Predict from bytes (web-compatible)
  static Future<CardioResult> predictFromBytes(Uint8List audioBytes, String filename) async {
    final url = Uri.parse(
      '${ApiConstants.cardioBaseUrl}${ApiConstants.cardioPredict}',
    );

    final request = http.MultipartRequest('POST', url)
      ..files.add(http.MultipartFile.fromBytes(
        'audio_file',
        audioBytes,
        filename: filename,
      ));

    final streamedResponse = await request.send().timeout(
      const Duration(seconds: 120),
    );
    final response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return CardioResult.fromJson(data);
    } else if (response.statusCode == 503) {
      throw Exception('Service is warming up. Please try again in a moment.');
    } else {
      throw Exception('Heart sound analysis failed: ${response.statusCode}');
    }
  }
}
