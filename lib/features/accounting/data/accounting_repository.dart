import 'package:altayar/features/accounting/data/accounting_api.dart';
import 'package:altayar/features/accounting/data/models/transaction_model.dart';
import 'package:altayar/features/accounting/data/models/wallet_summary.dart';
import 'package:altayar/features/membership/data/models/membership_card.dart';
import 'package:altayar/features/membership/data/models/referral_summary.dart';
import 'package:altayar/features/membership/data/membership_repository.dart';

class AccountingRepository {
  AccountingRepository(
    this._api,
    this._membershipRepository,
  );

  final AccountingApi _api;
  final MembershipRepository _membershipRepository;

  List<TransactionModel>? _transactionsCache;
  MembershipCard? _cardCache;
  ReferralSummary? _referralCache;
  WalletSummary? _walletCache;

  Future<List<TransactionModel>> getTransactions({bool force = false}) async {
    if (!force && _transactionsCache != null) {
      return _transactionsCache!;
    }
    final data = await _api.fetchTransactions();
    _transactionsCache = data;
    return data;
  }

  Future<WalletSummary> getWalletSummary({bool force = false}) async {
    if (!force && _walletCache != null) {
      return _walletCache!;
    }
    final card = await _getMembershipCard(force: force);
    final transactions = await getTransactions(force: force);
    final summary = WalletSummary.fromSources(card, transactions);
    _walletCache = summary;
    return summary;
  }

  Future<ReferralSummary> getReferralSummary({bool force = false}) async {
    if (!force && _referralCache != null) {
      return _referralCache!;
    }
    final summary = await _membershipRepository.getReferralSummary();
    _referralCache = summary;
    return summary;
  }

  Future<void> inviteFriend(String email) async {
    await _membershipRepository.invite(email);
    await getReferralSummary(force: true);
  }

  Future<MembershipCard> _getMembershipCard({bool force = false}) async {
    if (!force && _cardCache != null) {
      return _cardCache!;
    }
    final card = await _membershipRepository.getMembershipCard();
    _cardCache = card;
    return card;
  }
}
