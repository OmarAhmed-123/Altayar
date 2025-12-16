class ApiResult<T> {
  ApiResult({
    required this.data,
    this.statusCode,
    this.message,
  });

  final T data;
  final int? statusCode;
  final String? message;
}

