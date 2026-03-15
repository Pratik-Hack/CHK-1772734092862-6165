import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:medicoscope/core/constants/api_constants.dart';
import 'package:medicoscope/services/api_service.dart';

class _StreamUnavailable implements Exception {}

class ChatService {
  /// Non-streaming fallback — waits for full response.
  static Future<String> sendMessage({
    required String message,
    required String sessionId,
    required String patientProfile,
    String language = 'en',
    String? medicalContext,
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
            if (medicalContext != null) 'medical_context': medicalContext,
          }),
        )
        .timeout(const Duration(seconds: 60));

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
  /// Falls back to non-streaming `/chat` if `/chat/stream` is unavailable.
  static Stream<String> sendMessageStream({
    required String message,
    required String sessionId,
    required String patientProfile,
    String language = 'en',
    String? medicalContext,
  }) async* {
    final body = jsonEncode({
      'message': message,
      'session_id': sessionId,
      'patient_profile': patientProfile,
      'language': language,
      if (medicalContext != null) 'medical_context': medicalContext,
    });

    // ── Try streaming endpoint first ──────────────────────────────────
    bool streamWorked = false;
    try {
      final url = Uri.parse('${ApiConstants.chatbotBaseUrl}/chat/stream');
      final request = http.Request('POST', url);
      request.headers['Content-Type'] = 'application/json';
      request.body = body;

      final client = http.Client();
      try {
        final response =
            await client.send(request).timeout(const Duration(seconds: 60));

        if (response.statusCode == 503) {
          throw Exception(
              'Chatbot is warming up. Please try again in a moment.');
        }
        if (response.statusCode == 404 || response.statusCode == 405) {
          // Streaming endpoint not available — fall through to non-streaming
          throw _StreamUnavailable();
        }
        if (response.statusCode != 200) {
          throw Exception('Chatbot error: ${response.statusCode}');
        }

        String buffer = '';
        bool gotTokens = false;
        await for (final chunk in response.stream.transform(utf8.decoder)) {
          buffer += chunk;
          final lines = buffer.split('\n');
          buffer = lines.removeLast();

          for (final line in lines) {
            final trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              final data = trimmed.substring(6).trim();
              if (data == '[DONE]') {
                streamWorked = true;
                return;
              }
              try {
                final parsed = jsonDecode(data) as Map<String, dynamic>;
                if (parsed.containsKey('error')) {
                  throw Exception(parsed['error']);
                }
                if (parsed.containsKey('token') && parsed['token'] != null) {
                  gotTokens = true;
                  yield parsed['token'] as String;
                }
              } catch (e) {
                if (e is Exception && e.toString().contains('Chatbot')) {
                  rethrow;
                }
              }
            }
          }
        }

        if (gotTokens) {
          streamWorked = true;
          return;
        }
      } finally {
        client.close();
      }
    } on _StreamUnavailable {
      // Fall through to non-streaming
    } catch (e) {
      final msg = e.toString();
      // If it's a 503 warming up, rethrow immediately — don't retry
      if (msg.contains('warming up') || msg.contains('503')) rethrow;
      // For other errors (timeout, connection refused), try non-streaming
      if (streamWorked) rethrow;
    }

    // ── Fallback: non-streaming ───────────────────────────────────────
    final fullResponse = await sendMessage(
      message: message,
      sessionId: sessionId,
      patientProfile: patientProfile,
      language: language,
      medicalContext: medicalContext,
    );
    yield fullResponse;
  }

  /// Save chat message pair to DB
  static Future<void> saveMessageToDb({
    required String token,
    required String sessionId,
    required String userMessage,
    required String assistantMessage,
  }) async {
    try {
      final api = ApiService(token: token);
      await api.post(ApiConstants.chatMessage, {
        'sessionId': sessionId,
        'userMessage': userMessage,
        'assistantMessage': assistantMessage,
      });
    } catch (_) {
      // Silently fail — don't block chat UX
    }
  }

  /// Get chat history list
  static Future<List<Map<String, dynamic>>> getChatHistory(String token) async {
    final api = ApiService(token: token);
    final response = await api.get(ApiConstants.chatHistory);
    return List<Map<String, dynamic>>.from(response['sessions'] ?? []);
  }

  /// Get full chat session
  static Future<Map<String, dynamic>> getChatSession(
      String token, String sessionId) async {
    final api = ApiService(token: token);
    final response = await api.get('${ApiConstants.chatSession}/$sessionId');
    return response['chat'] as Map<String, dynamic>;
  }

  /// Delete a chat session
  static Future<void> deleteChatSession(String token, String sessionId) async {
    final api = ApiService(token: token);
    await api.delete('${ApiConstants.chatSession}/$sessionId');
  }

  /// Fetch the patient's full medical summary for chatbot context.
  /// Includes: conditions, medications, vitals, detections, mindspace sessions.
  static Future<String> fetchMedicalContext(String token) async {
    try {
      final api = ApiService(token: token);
      final data = await api.get(ApiConstants.patientMedicalSummary);

      final parts = <String>[];

      // Patient profile
      final patient = data['patient'] as Map<String, dynamic>? ?? {};
      if (patient.isNotEmpty) {
        final conditions = List<String>.from(patient['conditions'] ?? []);
        final medications = List.from(patient['medications'] ?? []);
        final bloodGroup = patient['bloodGroup'] ?? '';
        final dob = patient['dateOfBirth'] ?? '';

        if (bloodGroup.isNotEmpty) parts.add('Blood Group: $bloodGroup');
        if (dob.isNotEmpty) parts.add('Date of Birth: $dob');
        if (conditions.isNotEmpty) {
          parts.add('Known Conditions: ${conditions.join(", ")}');
        }
        if (medications.isNotEmpty) {
          final medStr = medications
              .map((m) => '${m['name']} (${m['dosage']}, ${m['frequency']})')
              .join('; ');
          parts.add('Current Medications: $medStr');
        }
      }

      // Recent detections (AI scans)
      final detections =
          List<Map<String, dynamic>>.from(data['detections'] ?? []);
      if (detections.isNotEmpty) {
        parts.add('\n--- Recent AI Scan Results ---');
        for (final d in detections) {
          final conf = ((d['confidence'] as num?) ?? 0) * 100;
          parts.add(
            '• ${d['category']}: ${d['className']} '
            '(${conf.toStringAsFixed(1)}% confidence) '
            'on ${d['date'] ?? 'unknown date'}'
            '${d['description'] != null && d['description'].toString().isNotEmpty ? " - ${d['description']}" : ""}',
          );
        }
      }

      // Recent vitals
      final vitals = List<Map<String, dynamic>>.from(data['vitals'] ?? []);
      if (vitals.isNotEmpty) {
        parts.add('\n--- Recent Vitals Monitoring Sessions ---');
        for (final v in vitals) {
          final alerts = List.from(v['alerts'] ?? []);
          parts.add(
            '• Session on ${v['date'] ?? 'unknown'}: '
            'HR avg ${v['avgHeartRate']} (${v['minHeartRate']}-${v['maxHeartRate']}), '
            'BP ${v['avgSystolic']}/${v['avgDiastolic']}, '
            'SpO2 avg ${v['avgSpO2']} (min ${v['minSpO2']})'
            '${alerts.isNotEmpty ? ", Alerts: ${alerts.length}" : ""}',
          );
        }
      }

      // MindSpace sessions
      final mindspace =
          List<Map<String, dynamic>>.from(data['mindspace'] ?? []);
      if (mindspace.isNotEmpty) {
        parts.add('\n--- Recent MindSpace Mental Health Check-ins ---');
        for (final s in mindspace) {
          parts.add(
            '• Check-in on ${s['date'] ?? 'unknown'} '
            '(urgency: ${s['urgency'] ?? 'low'}):\n'
            '  Patient said: "${s['transcript'] ?? ''}"'
            '${s['aiResponse'] != null && s['aiResponse'].toString().isNotEmpty ? "\n  AI Response: ${s['aiResponse']}" : ""}',
          );
        }
      }

      if (parts.isEmpty) return '';
      return parts.join('\n');
    } catch (_) {
      return '';
    }
  }
}
