// Conditional import for path_provider
import 'platform_utils_io.dart'
    if (dart.library.html) 'platform_utils_web.dart' as impl;

class PlatformUtils {
  /// Get a temporary directory path (mobile only)
  static Future<String> getTemporaryPath() async {
    return impl.getTemporaryPathImpl();
  }
}
