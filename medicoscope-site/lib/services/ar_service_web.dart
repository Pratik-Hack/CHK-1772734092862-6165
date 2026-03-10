/// Web stub for AR service — AR is not supported on web.
/// 3D model viewing is handled by the ModelViewer widget directly.

Future<bool> launchARViewerPlatform(String modelPath) async {
  return false;
}

bool isARSupportedPlatform() {
  return false;
}

String getARSupportMessagePlatform() {
  return '3D viewing is available in the browser. AR requires a mobile device.';
}
