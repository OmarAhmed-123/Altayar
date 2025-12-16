import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:altayar/features/membership/data/models/membership_plan.dart';
import 'package:altayar/features/membership/presentation/pages/fawaterak_checkout_page.dart';
import 'package:altayar/features/membership/presentation/providers/membership_provider.dart';

class MembershipCheckoutSheet extends StatefulWidget {
  const MembershipCheckoutSheet({super.key, required this.plan});

  final MembershipPlan plan;

  @override
  State<MembershipCheckoutSheet> createState() =>
      _MembershipCheckoutSheetState();
}

class _MembershipCheckoutSheetState extends State<MembershipCheckoutSheet>
    with WidgetsBindingObserver {
  bool _launching = false;
  bool _autoVerifying = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _attemptAutoVerification();
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<MembershipProvider>();
    final session = provider.activeSession;
    final isBusy = provider.isSubscribing || _launching || _autoVerifying;
    return Padding(
      padding: MediaQuery.of(context).viewInsets.add(const EdgeInsets.all(24)),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'إتمام الدفع لباقات ${widget.plan.name}',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Chip(
                avatar: const Icon(Icons.workspace_premium),
                label: Text(widget.plan.tier),
              ),
              const SizedBox(width: 12),
              Chip(label: Text('${widget.plan.durationDays ~/ 30} شهر')),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            'السعر: ${widget.plan.price.toStringAsFixed(2)} EGP',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 6),
          Text(
            'يتضمن ${widget.plan.points} نقطة و ${widget.plan.welcomeCashback.toStringAsFixed(0)} كاش باك ترحيبي.',
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: isBusy
                ? null
                : () async {
                    if (session == null) {
                      await _createSession(context);
                    } else {
                      await _openCheckoutAndVerify(session.paymentUrl);
                    }
                  },
            icon: isBusy
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Icon(session == null ? Icons.credit_card : Icons.verified),
            label: Text(
              session == null
                  ? 'دفع عبر Fawaterak'
                  : (_autoVerifying
                      ? 'جارِ التحقق من الدفع...'
                      : 'تأكيد الدفع وتفعيل العضوية'),
            ),
          ),
          if (session != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blueGrey.withAlpha((255 * 0.08).round()),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'تم إنشاء رابط الدفع عبر Fawaterak بنجاح.',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'رقم العملية: ${session.transactionId}',
                    style: Theme.of(context).textTheme.labelLarge,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'بمجرد العودة للتطبيق سنحاول التأكد من الدفع تلقائياً، ويمكنك أيضاً التحقق يدوياً من الزر أعلاه.',
                    style: Theme.of(
                      context,
                    ).textTheme.bodySmall?.copyWith(color: Colors.grey[600]),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () async {
                await _openCheckoutAndVerify(session.paymentUrl);
              },
              icon: const Icon(Icons.open_in_new),
              label: const Text('فتح رابط الدفع مجدداً'),
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _createSession(BuildContext context) async {
    final messenger = ScaffoldMessenger.of(context);
    setState(() => _launching = true);
    final membershipProvider = context.read<MembershipProvider>();
    final session = await membershipProvider.createPaymentSession(widget.plan);
    if (!mounted) return;
    setState(() => _launching = false);
    if (session == null) return;
    final verified = await _openCheckoutAndVerify(session.paymentUrl);
    if (!mounted) return;
    if (!verified) {
      messenger.showSnackBar(
        const SnackBar(
          content: Text('يمكنك العودة لاحقاً للتحقق من حالة الدفع.'),
        ),
      );
    }
  }

  Future<bool> _openCheckoutAndVerify(String url) async {
    final shouldVerify = await FawaterakCheckoutPage.open(context, url);
    if (!mounted) return false;
    if (shouldVerify) {
      await _verifyAndActivate(context);
      return true;
    }
    return false;
  }

  Future<void> _verifyAndActivate(BuildContext context) async {
    final messenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);
    setState(() => _autoVerifying = true);
    final membershipProvider = context.read<MembershipProvider>();
    final success = await membershipProvider.verifyPaymentAndActivate();
    if (!mounted) return;
    setState(() => _autoVerifying = false);
    if (!mounted) return;
    if (success) {
      navigator.pop(true);
      return;
    }
    final fallback = membershipProvider.errorMessage ??
        'لم يتم تأكيد الدفع بعد، جرّب بعد لحظات.';
    messenger.showSnackBar(SnackBar(content: Text(fallback)));
  }

  Future<void> _attemptAutoVerification() async {
    if (!mounted) return;
    final provider = context.read<MembershipProvider>();
    if (provider.activeSession == null || _autoVerifying) return;
    await _verifyAndActivate(context);
  }
}
