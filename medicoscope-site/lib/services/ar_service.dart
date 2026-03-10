import 'package:flutter/foundation.dart' show kIsWeb;

// Conditional import for platform-specific AR implementation
import 'ar_service_io.dart' if (dart.library.html) 'ar_service_web.dart'
    as platform;

class ARService {
  /// Launch AR viewer for the given 3D model
  /// On iOS: Uses AR Quick Look with GLB files
  /// On Android: Uses Scene Viewer with GLB files via FileProvider
  /// On Web: Returns false (3D viewing is handled by ModelViewer widget)
  static Future<bool> launchARViewer(String modelPath) async {
    if (kIsWeb) {
      return false;
    }
    return platform.launchARViewerPlatform(modelPath);
  }

  /// Check if AR is supported on the current device
  static bool isARSupported() {
    if (kIsWeb) return false;
    return platform.isARSupportedPlatform();
  }

  /// Get a user-friendly message about AR support
  static String getARSupportMessage() {
    if (kIsWeb) {
      return '3D viewing is available in the browser. AR requires a mobile device.';
    }
    return platform.getARSupportMessagePlatform();
  }
}
