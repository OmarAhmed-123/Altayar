import 'package:flutter/material.dart';

import 'package:altayar/core/utils/date_formatter.dart';
import 'package:altayar/features/accounting/data/models/transaction_model.dart';

class TransactionTile extends StatelessWidget {
  const TransactionTile({super.key, required this.transaction});

  final TransactionModel transaction;

  Color _statusColor(BuildContext context) {
    switch (transaction.status) {
      case 'completed':
        return Colors.green;
      case 'failed':
      case 'cancelled':
        return Theme.of(context).colorScheme.error;
      case 'pending':
      default:
        return Colors.amber[800] ?? Colors.amber;
    }
  }

  Color get _accent {
    switch (transaction.type) {
      case TransactionType.membershipPurchase:
        return Colors.deepPurple;
      case TransactionType.bookingPayment:
        return Colors.teal;
      case TransactionType.cashbackEarned:
        return Colors.green;
      case TransactionType.pointsSpent:
        return Colors.orange;
      case TransactionType.manualDeposit:
        return Colors.blueGrey;
      case TransactionType.invoicePayment:
        return Colors.indigo;
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      leading: CircleAvatar(
        backgroundColor: _accent.withAlpha((255 * .15).round()),
        child: Icon(
          Icons.swap_horiz,
          color: _accent,
        ),
      ),
      title: Text(
        transaction.readableType,
        style: const TextStyle(fontWeight: FontWeight.bold),
      ),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (transaction.description != null &&
              transaction.description!.isNotEmpty)
            Text(transaction.description!),
          Text(
            DateFormatter.format(transaction.createdAt),
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
      trailing: Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            '${transaction.isPositive ? '+' : '-'}${transaction.amount.abs().toStringAsFixed(2)} ${transaction.currency}',
            style: TextStyle(
              color: transaction.isPositive
                  ? Colors.green
                  : Theme.of(context).colorScheme.error,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            transaction.readableStatus,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: _statusColor(context),
                  fontWeight: FontWeight.w600,
                ),
          ),
          if (transaction.pointsChange != 0)
            Text(
              'نقاط: ${transaction.pointsChange > 0 ? '+' : ''}${transaction.pointsChange}',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          if (transaction.cashbackChange != 0)
            Text(
              'كاش باك: ${transaction.cashbackChange > 0 ? '+' : ''}${transaction.cashbackChange.toStringAsFixed(2)}',
              style: Theme.of(context).textTheme.bodySmall,
            ),
        ],
      ),
    );
  }
}
