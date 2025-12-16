import 'package:equatable/equatable.dart';

import 'package:altayar/features/user_management/data/models/user_account.dart';

class RoleMatrixEntry extends Equatable {
  const RoleMatrixEntry({
    required this.role,
    required this.title,
    required this.count,
    required this.permissions,
    this.trend,
  });

  final String role;
  final String title;
  final int count;
  final List<String> permissions;
  final double? trend;

  static List<RoleMatrixEntry> fromUsers(
    List<UserAccount> users,
    Map<String, RoleMatrixBlueprint> blueprint,
  ) {
    final counts = <String, int>{};
    for (final user in users) {
      counts.update(user.role, (value) => value + 1, ifAbsent: () => 1);
    }
    final entries = <RoleMatrixEntry>[];
    blueprint.forEach((role, data) {
      entries.add(RoleMatrixEntry(
        role: role,
        title: data.label,
        count: counts[role] ?? 0,
        permissions: data.permissions,
        trend: data.expectedTrend,
      ));
    });
    return entries;
  }

  @override
  List<Object?> get props => [role, count, trend];
}

class RoleMatrixBlueprint {
  const RoleMatrixBlueprint({
    required this.label,
    required this.permissions,
    this.expectedTrend,
  });

  final String label;
  final List<String> permissions;
  final double? expectedTrend;
}

class LiveMetric extends Equatable {
  const LiveMetric({
    required this.label,
    required this.value,
    this.trend,
    this.icon,
  });

  final String label;
  final num value;
  final double? trend;
  final String? icon;

  @override
  List<Object?> get props => [label, value, trend, icon];
}

class RecentActivity extends Equatable {
  const RecentActivity({
    required this.title,
    required this.description,
    required this.time,
  });

  final String title;
  final String description;
  final DateTime? time;

  factory RecentActivity.fromMap(Map<String, dynamic> json) {
    return RecentActivity(
      title: json['title']?.toString() ?? 'نشاط',
      description:
          json['description']?.toString() ?? json['message']?.toString() ?? '',
      time: DateTime.tryParse(json['created_at']?.toString() ?? ''),
    );
  }

  @override
  List<Object?> get props => [title, description, time];
}

const Map<String, RoleMatrixBlueprint> kRoleBlueprint = {
  'super_admin': RoleMatrixBlueprint(
    label: 'Super Admin',
    permissions: [
      'تحكم كامل بالمنصة',
      'إدارة الصلاحيات',
      'مراجعة السجلات الحساسة',
    ],
    expectedTrend: 0,
  ),
  'admin': RoleMatrixBlueprint(
    label: 'Admin',
    permissions: [
      'إدارة العضويات',
      'ترقية المستخدمين',
      'تسجيل الهدايا اليدوية',
    ],
    expectedTrend: 1.5,
  ),
  'hr': RoleMatrixBlueprint(
    label: 'Human Resources',
    permissions: [
      'إدارة ملفات الموظفين',
      'ضبط مهام الفرق',
      'اعتماد صلاحيات جديدة',
    ],
    expectedTrend: 1.0,
  ),
  'sales': RoleMatrixBlueprint(
    label: 'Sales',
    permissions: [
      'تفعيل العضويات',
      'تقديم هدايا الترقية',
      'متابعة عملاء VIP',
    ],
    expectedTrend: 2.0,
  ),
  'reservations': RoleMatrixBlueprint(
    label: 'Reservation Agent',
    permissions: [
      'إدارة الحجوزات',
      'تحديث حالة الرحلات',
      'إرسال إشعارات العملاء',
    ],
    expectedTrend: 1.2,
  ),
  'accountant': RoleMatrixBlueprint(
    label: 'Accounting',
    permissions: [
      'تسوية المدفوعات',
      'اعتماد cashback',
      'إصدار الفواتير',
    ],
    expectedTrend: 0.8,
  ),
  'support': RoleMatrixBlueprint(
    label: 'Support',
    permissions: [
      'التعامل مع الشكاوى',
      'رفع البلاغات للإدارة',
      'تفعيل هدايا الترضية',
    ],
    expectedTrend: 1.7,
  ),
  'agent': RoleMatrixBlueprint(
    label: 'External Agent',
    permissions: [
      'عرض عملائه فقط',
      'متابعة الإحالات',
      'تقديم تقارير دورية',
    ],
    expectedTrend: 1.1,
  ),
  'customer': RoleMatrixBlueprint(
    label: 'Customer',
    permissions: [
      'إدارة عضويته',
      'جمع النقاط والكاش باك',
      'إرسال إحالات',
    ],
    expectedTrend: 3.2,
  ),
};
