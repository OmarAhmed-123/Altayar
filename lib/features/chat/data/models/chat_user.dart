import 'package:equatable/equatable.dart';

class ChatUser extends Equatable {
  const ChatUser({
    required this.id,
    required this.name,
    required this.role,
    this.avatarUrl,
  });

  final int id;
  final String name;
  final String role;
  final String? avatarUrl;

  factory ChatUser.fromJson(Map<String, dynamic> json) {
    return ChatUser(
      id: json['id'] as int? ?? 0,
      name: json['name']?.toString() ?? '',
      role: json['role']?.toString() ?? 'customer',
      avatarUrl: json['avatar']?.toString(),
    );
  }

  bool get isSupport => [
        'sales',
        'reservations',
        'accountant',
        'admin',
        'super_admin',
        'agent'
      ].contains(role.toLowerCase());

  @override
  List<Object?> get props => [id, name, role];
}
