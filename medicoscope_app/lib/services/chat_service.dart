import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:medicoscope/core/constants/api_constants.dart';

class ChatService {
  /// Non-streaming fallback — waits for full response.
  static Future<String> sendMessage({
    required String message,
    required String sessionId,
    required String patientProfile,
    String language = 'en',
  }) async {
    final url = Uri.parse('${ApiConstants.chatbotBaseUrl}/chat');

    final response = await http
        .post(
          url,
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'message': message,
            'session_id': sessionId,
            'patient_profile': patientProfile,
            'language': language,
          }),
        )
        .timeout(const Duration(seconds: 30));

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['response'] as String;
    } else if (response.statusCode == 503) {
      throw Exception('Chatbot is warming up. Please try again in a moment.');
    } else {
      throw Exception('Chatbot error: ${response.statusCode}');
    }
  }

  /// Streaming method — yields token chunks as they arrive via SSE.
  static Stream<String> sendMessageStream({
    required String message,
    required String sessionId,
    required String patientProfile,
    String language = 'en',
  }) async* {
    final url = Uri.parse('${ApiConstants.chatbotBaseUrl}/chat/stream');
    final request = http.Request('POST', url);
    request.headers['Content-Type'] = 'application/json';
    request.body = jsonEncode({
      'message': message,
      'session_id': sessionId,
      'patient_profile': patientProfile,
      'language': language,
    });

    final client = http.Client();
    try {
      final response = await client
          .send(request)
          .timeout(const Duration(seconds: 30));

      if (response.statusCode == 503) {
        throw Exception('Chatbot is warming up. Please try again in a moment.');
      }
      if (response.statusCode != 200) {
        throw Exception('Chatbot error: ${response.statusCode}');
      }

      String buffer = '';
      await for (final chunk in response.stream.transform(utf8.decoder)) {
        buffer += chunk;
        final lines = buffer.split('\n');
        buffer = lines.removeLast(); // keep incomplete line in buffer

        for (final line in lines) {
          final trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            final data = trimmed.substring(6).trim();
            if (data == '[DONE]') return;
            try {
              final parsed = jsonDecode(data) as Map<String, dynamic>;
              if (parsed.containsKey('error')) {
                throw Exception(parsed['error']);
              }
              if (parsed.containsKey('token') && parsed['token'] != null) {
                yield parsed['token'] as String;
              }
            } catch (e) {
              if (e is Exception &&
                  e.toString().contains('Chatbot')) {
                rethrow;
              }
              // Skip malformed SSE lines
            }
          }
        }
      }
    } finally {
      client.close();
    }
  }
}
