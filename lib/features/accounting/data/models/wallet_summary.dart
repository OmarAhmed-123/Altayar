import 'package:altayar/features/accounting/data/models/transaction_model.dart';
import 'package:altayar/features/membership/data/models/membership_card.dart';

class WalletSummary {
  const WalletSummary({
    required this.pointsBalance,
    required this.cashbackBalance,
    required this.lifetimePointsEarned,
    required this.lifetimeCashbackEarned,
    required this.totalSpend,
    required this.lastUpdated,
  });

  final int pointsBalance;
  final double cashbackBalance;
  final int lifetimePointsEarned;
  final double lifetimeCashbackEarned;
  final double totalSpend;
  final DateTime lastUpdated;

  factory WalletSummary.fromSources(
    MembershipCard card,
    List<TransactionModel> transactions,
  ) {
    final lifetimePoints = transactions.fold<int>(
      0,
      (sum, tx) => tx.pointsChange > 0 ? sum + tx.pointsChange : sum,
    );
    final lifetimeCashback = transactions.fold<double>(
      0,
      (sum, tx) => tx.cashbackChange > 0 ? sum + tx.cashbackChange : sum,
    );
    final spend = transactions
        .where(
          (tx) =>
              tx.type == TransactionType.membershipPurchase ||
              tx.type == TransactionType.bookingPayment ||
              tx.type == TransactionType.invoicePayment,
        )
        .fold<double>(0, (sum, tx) => sum + tx.amount.abs());

    return WalletSummary(
      pointsBalance: card.pointsBalance,
      cashbackBalance: card.cashbackBalance,
      lifetimePointsEarned: lifetimePoints,
      lifetimeCashbackEarned: lifetimeCashback,
      totalSpend: spend,
      lastUpdated: DateTime.now(),
    );
  }
}
