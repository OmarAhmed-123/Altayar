import 'package:flutter/material.dart';

import 'package:altayar/core/widgets/animated_card.dart';
import 'package:altayar/core/widgets/gradient_button.dart';
import 'package:altayar/core/theme/app_colors.dart';
import 'package:altayar/core/utils/date_formatter.dart';
import 'package:altayar/features/vouchers/data/models/voucher_model.dart';

class VoucherCard extends StatelessWidget {
  const VoucherCard({
    super.key,
    required this.voucher,
    this.onRedeem,
  });

  final VoucherModel voucher;
  final VoidCallback? onRedeem;

  Color get statusColor {
    if (voucher.isExpired) return Colors.redAccent;
    if (voucher.isRedeemed) return Colors.blueGrey;
    return Colors.green;
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedCard(
      borderRadius: BorderRadius.circular(20),
      margin: const EdgeInsets.only(bottom: 16),
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              statusColor.withOpacity(0.08),
              statusColor.withOpacity(0.03),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: statusColor.withOpacity(0.2),
            width: 1.5,
          ),
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: LinearGradient(
                      colors: [
                        statusColor,
                        statusColor.withOpacity(0.7),
                      ],
                    ),
                  ),
                  child: const Icon(
                    Icons.card_giftcard,
                    color: Colors.white,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    voucher.type,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: AppColors.dark,
                        ),
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: statusColor.withOpacity(0.4),
                      width: 1,
                    ),
                  ),
                  child: Text(
                    voucher.status.toUpperCase(),
                    style: TextStyle(
                      color: statusColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 11,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              voucher.description ?? 'استمتع بتجربتك المميزة.',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                const Icon(Icons.confirmation_num_outlined, size: 18),
                const SizedBox(width: 6),
                SelectableText('#${voucher.code}'),
              ],
            ),
            if (voucher.value != null) ...[
              const SizedBox(height: 6),
              Row(
                children: [
                  const Icon(Icons.card_giftcard, size: 18),
                  const SizedBox(width: 6),
                  Text('${voucher.value!.toStringAsFixed(0)} EGP'),
                ],
              ),
            ],
            const SizedBox(height: 6),
            Row(
              children: [
                const Icon(Icons.date_range, size: 18),
                const SizedBox(width: 6),
                Text(
                  voucher.expiresAt == null
                      ? 'بدون تاريخ انتهاء'
                      : 'صالحة حتى ${DateFormatter.format(voucher.expiresAt!)}',
                ),
              ],
            ),
            if (voucher.userName != null) ...[
              const SizedBox(height: 6),
              Row(
                children: [
                  const Icon(Icons.person_outline, size: 18),
                  const SizedBox(width: 6),
                  Text(voucher.userName ?? ''),
                ],
              ),
            ],
            if (voucher.isActive && onRedeem != null) ...[
              const SizedBox(height: 16),
              GradientButton(
                label: 'تفعيل القسيمة',
                icon: Icons.check_circle_outline,
                onPressed: onRedeem,
                colors: AppColors.successGradient,
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 12,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
