Future<String> getTemporaryPathImpl() async {
  // On web, there's no filesystem — return empty string
  // Audio recording on web uses blob URLs instead
  return '';
}
