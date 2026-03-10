import 'package:path_provider/path_provider.dart';

Future<String> getTemporaryPathImpl() async {
  final dir = await getTemporaryDirectory();
  return dir.path;
}
