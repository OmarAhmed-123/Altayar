class RoleCapability {
  RoleCapability({
    required this.role,
    required this.title,
    required this.permissions,
  });

  final String role;
  final String title;
  final List<String> permissions;
}

class RoleMatrix {
  RoleMatrix._();

  static final List<RoleCapability> capabilities = [
    RoleCapability(
      role: 'super_admin',
      title: 'Super Admin',
      permissions: [
        'إدارة كاملة للنظام',
        'إنشاء أدوار ووظائف جديدة',
        'التحكم في RBAC و Multi-Tenant',
        'تتبع الصلاحيات والمهام',
      ],
    ),
    RoleCapability(
      role: 'admin',
      title: 'Admin',
      permissions: [
        'لوحة التحكم العامة',
        'إدارة المستخدمين والعضويات',
        'اعتماد الهدايا اليدوية',
        'الاطلاع على التقارير المالية',
      ],
    ),
    RoleCapability(
      role: 'sales',
      title: 'Sales',
      permissions: [
        'تفعيل/ترقية العضويات',
        'إرسال الهدايا اليدوية للعملاء',
        'متابعة عملاء VIP',
      ],
    ),
    RoleCapability(
      role: 'hr',
      title: 'HR',
      permissions: [
        'إدارة ملفات الموظفين',
        'تحديد الصلاحيات الوظيفية',
        'قياس الأداء الشهري',
      ],
    ),
    RoleCapability(
      role: 'accountant',
      title: 'Accounting',
      permissions: [
        'مراجعة عمليات الدفع',
        'تتبع الكاش باك',
        'إصدار فواتير العضويات',
      ],
    ),
    RoleCapability(
      role: 'reservations',
      title: 'Reservation Agent',
      permissions: [
        'إدارة الحجوزات',
        'اعتماد التذاكر',
        'تقديم تحديثات الحالة',
      ],
    ),
    RoleCapability(
      role: 'support',
      title: 'Support',
      permissions: [
        'الرد على التذاكر',
        'ترفيع الشكاوى',
        'تقديم هدايا تعويضية عبر الطلب',
      ],
    ),
    RoleCapability(
      role: 'agent',
      title: 'External Agent',
      permissions: [
        'الوصول لعملائه فقط',
        'مشاركة روابط الإحالة',
        'رفع تقارير أسبوعية',
      ],
    ),
    RoleCapability(
      role: 'customer',
      title: 'Customer',
      permissions: [
        'الوصول للعضوية',
        'إرسال إحالات',
        'عرض النقاط والكاش باك',
      ],
    ),
  ];
}
