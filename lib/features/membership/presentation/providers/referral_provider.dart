import 'package:flutter/foundation.dart';

import 'package:altayar/core/networking/api_exceptions.dart';
import 'package:altayar/features/membership/data/membership_repository.dart';
import 'package:altayar/features/membership/data/models/referral_summary.dart';

class ReferralProvider extends ChangeNotifier {
  ReferralProvider(this._repository);

  final MembershipRepository _repository;

  ReferralSummary? summary;
  bool isLoading = false;
  bool isInviting = false;
  String? errorMessage;
  String? successMessage;

  Future<void> loadSummary() async {
    isLoading = true;
    notifyListeners();
    try {
      summary = await _repository.getReferralSummary();
      errorMessage = null;
    } on ApiException catch (error) {
      errorMessage = error.message;
      summary ??= const ReferralSummary(
        referralCode: 'ALT-YAR-000',
        totalInvites: 0,
        successfulInvites: 0,
        rewardPoints: 0,
        rewardValue: 0,
        statusBreakdown: {},
      );
    } catch (_) {
      errorMessage = 'تعذّر تحميل بيانات الإحالات';
      summary ??= const ReferralSummary(
        referralCode: 'ALT-YAR-000',
        totalInvites: 0,
        successfulInvites: 0,
        rewardPoints: 0,
        rewardValue: 0,
        statusBreakdown: {},
      );
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Map<String, dynamic>? lastInviteResponse;

  Future<Map<String, dynamic>?> inviteFriend(String email) async {
    isInviting = true;
    successMessage = null;
    errorMessage = null;
    lastInviteResponse = null;
    notifyListeners();
    try {
      final response = await _repository.invite(email);
      lastInviteResponse = response;

      // Check if user is already registered
      if (response['data'] != null &&
          response['data']['isRegistered'] == true) {
        // User is already registered - show their info
        final userData = response['data']['user'] as Map<String, dynamic>?;
        if (userData != null) {
          successMessage = 'هذا المستخدم مسجل بالفعل في التطبيق';
          // Don't reload summary if user is already registered
        }
      } else {
        // New invite sent successfully
        successMessage =
            response['message'] as String? ?? 'تم إرسال الدعوة بنجاح';
        // Reload summary to update numbers (total invites, successful invites, reward points)
        await loadSummary();
      }
      return response;
    } on ApiException catch (error) {
      errorMessage = error.message;
      return null;
    } catch (_) {
      errorMessage = 'تعذّر إرسال الدعوة';
      return null;
    } finally {
      isInviting = false;
      notifyListeners();
    }
  }
}
