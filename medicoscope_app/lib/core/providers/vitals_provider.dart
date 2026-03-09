import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:medicoscope/services/vitals_service.dart';

class VitalDataPoint {
  final int tick;
  final String timestamp;
  final double heartRate;
  final double systolic;
  final double diastolic;
  final double spo2;

  VitalDataPoint({
    required this.tick,
    required this.timestamp,
    required this.heartRate,
    required this.systolic,
    required this.diastolic,
    required this.spo2,
  });

  factory VitalDataPoint.fromJson(Map<String, dynamic> json) {
    return VitalDataPoint(
      tick: json['tick'] as int,
      timestamp: json['timestamp'] as String,
      heartRate: (json['heart_rate'] as num).toDouble(),
      systolic: (json['systolic'] as num).toDouble(),
      diastolic: (json['diastolic'] as num).toDouble(),
      spo2: (json['spo2'] as num).toDouble(),
    );
  }
}

class VitalAlert {
  final String type;
  final String severity;
  final String message;
  final String vital;
  final double currentValue;
  final double predictedValue;
  final String timestamp;
  final String location;
  final double latitude;
  final double longitude;
  final String mapsUrl;
  final String emergencyContactName;
  final String emergencyContactPhone;
  final String patientName;

  VitalAlert({
    required this.type,
    required this.severity,
    required this.message,
    required this.vital,
    required this.currentValue,
    required this.predictedValue,
    required this.timestamp,
    this.location = '',
    this.latitude = 0.0,
    this.longitude = 0.0,
    this.mapsUrl = '',
    this.emergencyContactName = '',
    this.emergencyContactPhone = '',
    this.patientName = '',
  });

  factory VitalAlert.fromJson(Map<String, dynamic> json) {
    return VitalAlert(
      type: json['type'] as String,
      severity: json['severity'] as String,
      message: json['message'] as String,
      vital: json['vital'] as String,
      currentValue: (json['current_value'] as num).toDouble(),
      predictedValue: (json['predicted_value'] as num).toDouble(),
      timestamp: json['timestamp'] as String,
      location: json['location'] as String? ?? '',
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0.0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0.0,
      mapsUrl: json['maps_url'] as String? ?? '',
      emergencyContactName: json['emergency_contact_name'] as String? ?? '',
      emergencyContactPhone: json['emergency_contact_phone'] as String? ?? '',
      patientName: json['patient_name'] as String? ?? '',
    );
  }
}

/// Callback type for when new alerts arrive during monitoring.
typedef OnNewAlertsCallback = void Function(List<VitalAlert> newAlerts);

class VitalsProvider extends ChangeNotifier {
  String? _sessionId;
  String? _scenario;
  bool _isMonitoring = false;
  bool _isStarting = false;
  String? _error;
  Timer? _tickTimer;
  DateTime? _sessionStart;
  String _sessionLocation = 'Unknown';

  final List<VitalDataPoint> _dataPoints = [];
  final List<VitalDataPoint> _allDataPoints = []; // unclipped for summary
  final List<VitalAlert> _alerts = [];

  /// Optional callback invoked when new alerts arrive (for SMS triggering).
  OnNewAlertsCallback? onNewAlerts;

  // Max points to keep in memory for graph display
  static const int _maxPoints = 100;

  String? get sessionId => _sessionId;
  String? get scenario => _scenario;
  bool get isMonitoring => _isMonitoring;
  bool get isStarting => _isStarting;
  String? get error => _error;
  List<VitalDataPoint> get dataPoints => _dataPoints;
  List<VitalAlert> get alerts => _alerts;

  VitalDataPoint? get latestPoint =>
      _dataPoints.isNotEmpty ? _dataPoints.last : null;

  double get currentHR => latestPoint?.heartRate ?? 0;
  double get currentSystolic => latestPoint?.systolic ?? 0;
  double get currentDiastolic => latestPoint?.diastolic ?? 0;
  double get currentSpO2 => latestPoint?.spo2 ?? 0;

  Future<void> startMonitoring({
    required String patientId,
    required String patientName,
    required String doctorId,
    String emergencyContactName = '',
    String emergencyContactPhone = '',
    String location = 'Unknown',
    double latitude = 0.0,
    double longitude = 0.0,
  }) async {
    _isStarting = true;
    _error = null;
    notifyListeners();

    try {
      final result = await VitalsService.startSession(
        patientId: patientId,
        patientName: patientName,
        doctorId: doctorId,
        emergencyContactName: emergencyContactName,
        emergencyContactPhone: emergencyContactPhone,
        location: location,
        latitude: latitude,
        longitude: longitude,
      );

      _sessionId = result['session_id'] as String;
      _scenario = result['scenario'] as String?;
      _isMonitoring = true;
      _isStarting = false;
      _sessionStart = DateTime.now();
      _sessionLocation = location;
      _dataPoints.clear();
      _allDataPoints.clear();
      _alerts.clear();
      notifyListeners();

      // Start polling for data every 3 seconds
      _tickTimer = Timer.periodic(
        const Duration(seconds: 3),
        (_) => _fetchTick(),
      );

      // Fetch first batch immediately
      await _fetchTick();
    } catch (e) {
      _isStarting = false;
      final msg = e.toString();
      if (msg.contains('TimeoutException') || msg.contains('timed out')) {
        _error = 'Server is warming up. Please wait a moment and try again.';
      } else {
        _error = msg;
      }
      notifyListeners();
    }
  }

  Future<void> _fetchTick() async {
    if (_sessionId == null || !_isMonitoring) return;

    try {
      final result = await VitalsService.tick(sessionId: _sessionId!);

      final points = (result['data_points'] as List)
          .map((p) => VitalDataPoint.fromJson(p as Map<String, dynamic>))
          .toList();

      _dataPoints.addAll(points);
      _allDataPoints.addAll(points);

      // Trim old points for display
      if (_dataPoints.length > _maxPoints) {
        _dataPoints.removeRange(0, _dataPoints.length - _maxPoints);
      }

      // Process alerts
      final alertsJson = result['alerts'] as List? ?? [];
      final newAlerts = <VitalAlert>[];
      for (final a in alertsJson) {
        final alert = VitalAlert.fromJson(a as Map<String, dynamic>);
        _alerts.add(alert);
        newAlerts.add(alert);
      }

      // Notify callback for SMS triggering
      if (newAlerts.isNotEmpty && onNewAlerts != null) {
        onNewAlerts!(newAlerts);
      }

      _error = null;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<void> stopMonitoring({String? token}) async {
    _tickTimer?.cancel();
    _tickTimer = null;

    final savedSessionId = _sessionId;

    if (_sessionId != null) {
      try {
        await VitalsService.stopSession(sessionId: _sessionId!);
      } catch (_) {
        // Best effort cleanup
      }
    }

    // Persist session summary to MongoDB
    if (token != null && savedSessionId != null && _allDataPoints.isNotEmpty) {
      try {
        final pts = _allDataPoints;
        final duration = _sessionStart != null
            ? DateTime.now().difference(_sessionStart!).inSeconds
            : 0;

        final hrValues = pts.map((p) => p.heartRate).toList();
        final sysValues = pts.map((p) => p.systolic).toList();
        final diaValues = pts.map((p) => p.diastolic).toList();
        final spo2Values = pts.map((p) => p.spo2).toList();

        double avg(List<double> v) => v.isEmpty ? 0 : v.reduce((a, b) => a + b) / v.length;

        await VitalsService.saveSessionSummary(
          token: token,
          sessionData: {
            'sessionId': savedSessionId,
            'duration': duration,
            'dataPointCount': pts.length,
            'avgHeartRate': avg(hrValues),
            'maxHeartRate': hrValues.reduce(math.max),
            'minHeartRate': hrValues.reduce(math.min),
            'avgSystolic': avg(sysValues),
            'maxSystolic': sysValues.reduce(math.max),
            'avgDiastolic': avg(diaValues),
            'avgSpO2': avg(spo2Values),
            'minSpO2': spo2Values.reduce(math.min),
            'alerts': _alerts.map((a) => {
              'type': a.type,
              'severity': a.severity,
              'message': a.message,
              'vital': a.vital,
              'currentValue': a.currentValue,
              'predictedValue': a.predictedValue,
              'timestamp': a.timestamp,
            }).toList(),
            'location': _sessionLocation,
          },
        );
      } catch (_) {
        // Best effort — don't block UI on save failure
      }
    }

    _isMonitoring = false;
    _sessionId = null;
    _sessionStart = null;
    onNewAlerts = null;
    _allDataPoints.clear();
    notifyListeners();
  }

  void clearAlerts() {
    _alerts.clear();
    notifyListeners();
  }

  @override
  void dispose() {
    _tickTimer?.cancel();
    super.dispose();
  }
}
