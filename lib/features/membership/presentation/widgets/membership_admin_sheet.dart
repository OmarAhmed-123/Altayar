import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:altayar/features/membership/data/models/membership_plan.dart';
import 'package:altayar/features/membership/presentation/providers/membership_provider.dart';

class MembershipAdminSheet extends StatefulWidget {
  const MembershipAdminSheet({super.key, required this.plan});

  final MembershipPlan plan;

  @override
  State<MembershipAdminSheet> createState() => _MembershipAdminSheetState();
}

class _MembershipAdminSheetState extends State<MembershipAdminSheet> {
  late final TextEditingController _priceController;
  late final TextEditingController _pointsController;
  late final TextEditingController _multiplierController;
  late final TextEditingController _cashbackController;
  late final TextEditingController _welcomePointsController;
  late final TextEditingController _welcomeCashbackController;

  @override
  void initState() {
    super.initState();
    final plan = widget.plan;
    _priceController =
        TextEditingController(text: plan.price.toStringAsFixed(2));
    _pointsController = TextEditingController(text: plan.points.toString());
    _multiplierController =
        TextEditingController(text: plan.pointMultiplier.toStringAsFixed(2));
    _cashbackController =
        TextEditingController(text: plan.cashbackRate.toStringAsFixed(2));
    _welcomePointsController =
        TextEditingController(text: plan.welcomePoints.toString());
    _welcomeCashbackController =
        TextEditingController(text: plan.welcomeCashback.toStringAsFixed(2));
  }

  @override
  void dispose() {
    _priceController.dispose();
    _pointsController.dispose();
    _multiplierController.dispose();
    _cashbackController.dispose();
    _welcomePointsController.dispose();
    _welcomeCashbackController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<MembershipProvider>();
    return Padding(
      padding: MediaQuery.of(context).viewInsets.add(const EdgeInsets.all(24)),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'تحديث باقة ${widget.plan.name}',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 16),
          _buildNumberField(_priceController, 'السعر (EGP)'),
          const SizedBox(height: 12),
          _buildNumberField(_pointsController, 'النقاط المكتسبة'),
          const SizedBox(height: 12),
          _buildNumberField(_multiplierController, 'مضاعف النقاط'),
          const SizedBox(height: 12),
          _buildNumberField(_cashbackController, 'نسبة الكاش باك %'),
          const SizedBox(height: 12),
          _buildNumberField(_welcomePointsController, 'نقاط الترحيب'),
          const SizedBox(height: 12),
          _buildNumberField(_welcomeCashbackController, 'كاش باك الترحيب'),
          const SizedBox(height: 20),
          FilledButton.icon(
            onPressed: provider.isUpdatingPlan
                ? null
                : () async {
                    final updated = await provider.updatePlanValues(
                      widget.plan,
                      price: double.tryParse(_priceController.text),
                      points: int.tryParse(_pointsController.text),
                      pointMultiplier:
                          double.tryParse(_multiplierController.text),
                      cashbackRate: double.tryParse(_cashbackController.text),
                      welcomePoints:
                          int.tryParse(_welcomePointsController.text),
                      welcomeCashback:
                          double.tryParse(_welcomeCashbackController.text),
                    );
                    if (!context.mounted) return;
                    if (updated != null) Navigator.of(context).pop();
                  },
            icon: provider.isUpdatingPlan
                ? const SizedBox(
                    height: 18,
                    width: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.save),
            label: const Text('حفظ التغييرات'),
          ),
        ],
      ),
    );
  }

  Widget _buildNumberField(TextEditingController controller, String label) {
    return TextField(
      controller: controller,
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      decoration: InputDecoration(
        labelText: label,
        border: const OutlineInputBorder(),
      ),
    );
  }
}
