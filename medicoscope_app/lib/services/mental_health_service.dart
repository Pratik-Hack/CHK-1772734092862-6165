import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:medicoscope/core/constants/api_constants.dart';

class MentalHealthService {
  static Future<Map<String, dynamic>> uploadAudio({
    required String filePath,
    required String patientId,
    required String patientName,
    required String doctorId,
  }) async {
    final url = Uri.parse(
      '${ApiConstants.chatbotBaseUrl}${ApiConstants.mentalHealthAnalyze}',
    );

    final request = http.MultipartRequest('POST', url)
      ..fields['patient_id'] = patientId
      ..fields['patient_name'] = patientName
      ..fields['doctor_id'] = doctorId
      ..files.add(await http.MultipartFile.fromPath('audio', filePath));

    final streamedResponse = await request.send().timeout(
      const Duration(seconds: 120),
    );
    final response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode == 200) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    } else if (response.statusCode == 503) {
      throw Exception('Service is warming up. Please try again in a moment.');
    } else {
      throw Exception('Analysis failed: ${response.statusCode}');
    }
  }

  static Future<List<Map<String, dynamic>>> getNotifications({
    required String doctorId,
  }) async {
    final url = Uri.parse(
      '${ApiConstants.chatbotBaseUrl}${ApiConstants.mentalHealthNotifications}/$doctorId',
    );

    final response = await http.get(url).timeout(const Duration(seconds: 30));

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return List<Map<String, dynamic>>.from(data['notifications'] ?? []);
    } else {
      throw Exception('Failed to fetch notifications: ${response.statusCode}');
    }
  }

  static Future<void> markAsRead({required String notificationId}) async {
    final url = Uri.parse(
      '${ApiConstants.chatbotBaseUrl}${ApiConstants.mentalHealthNotifications}/$notificationId/read',
    );

    final response = await http.put(url).timeout(const Duration(seconds: 15));

    if (response.statusCode != 200) {
      throw Exception('Failed to mark as read: ${response.statusCode}');
    }
  }

  static Future<String> redeemReward({
    required String rewardType,
    required String patientName,
  }) async {
    final url = Uri.parse(
      '${ApiConstants.chatbotBaseUrl}${ApiConstants.rewardsRedeem}',
    );

    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'reward_type': rewardType,
        'patient_name': patientName,
      }),
    ).timeout(const Duration(seconds: 60));

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['content'] as String? ?? 'Content unavailable.';
    } else if (response.statusCode == 503) {
      throw Exception('Service is warming up. Please try again in a moment.');
    } else {
      throw Exception('Failed to generate reward: ${response.statusCode}');
    }
  }
}
