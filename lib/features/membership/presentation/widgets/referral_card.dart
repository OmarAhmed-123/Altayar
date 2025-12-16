import 'package:flutter/material.dart';

import 'package:altayar/features/membership/data/models/referral_summary.dart';

class ReferralCard extends StatefulWidget {
  const ReferralCard({
    super.key,
    required this.summary,
    required this.onInvite,
    required this.isInviting,
  });

  final ReferralSummary summary;
  final ValueChanged<String> onInvite;
  final bool isInviting;

  @override
  State<ReferralCard> createState() => _ReferralCardState();
}

class _ReferralCardState extends State<ReferralCard> {
  late final TextEditingController controller;

  @override
  void initState() {
    super.initState();
    controller = TextEditingController();
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.group_add_rounded),
                const SizedBox(width: 12),
                Text(
                  'برنامج الإحالة',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ],
            ),
            const SizedBox(height: 16),
            SelectableText(
              'رمز الدعوة: ${widget.summary.referralCode}',
              style: Theme.of(context).textTheme.bodyLarge,
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _Stat(title: 'الدعوات', value: widget.summary.totalInvites),
                _Stat(
                  title: 'المكتملة',
                  value: widget.summary.successfulInvites,
                ),
                _Stat(title: 'النقاط', value: widget.summary.rewardPoints),
              ],
            ),
            const Divider(height: 32),
            TextField(
              controller: controller,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(
                labelText: 'إيميل الصديق',
              ),
            ),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: widget.isInviting
                  ? null
                  : () {
                      final email = controller.text.trim();
                      if (email.isNotEmpty) {
                        widget.onInvite(email);
                        controller.clear(); // Clear email field after sending
                      } else {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('يرجى إدخال إيميل صحيح'),
                          ),
                        );
                      }
                    },
              icon: widget.isInviting
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.send),
              label: const Text('إرسال دعوة'),
            ),
          ],
        ),
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.title, required this.value});

  final String title;
  final num value;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          '$value',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        Text(title, style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }
}
