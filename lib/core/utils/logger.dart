import 'dart:developer' as developer;

class AppLogger {
  AppLogger._();

  static void info(String message) {
    developer.log(message, level: 800, name: 'ALTAYAR');
  }

  static void warn(String message) {
    developer.log(message, level: 900, name: 'ALTAYAR');
  }

  static void error(String message, [Object? error, StackTrace? stackTrace]) {
    developer.log(
      message,
      level: 1000,
      name: 'ALTAYAR',
      error: error,
      stackTrace: stackTrace,
    );
  }
}
