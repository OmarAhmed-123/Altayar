import 'dart:io';

import 'package:flutter/material.dart';

import 'package:altayar/features/ad_manager/data/ad_repository.dart';
import 'package:altayar/features/ad_manager/data/models/ad_campaign.dart';

class AdProvider extends ChangeNotifier {
  AdProvider(this._repository);

  final AdRepository _repository;

  List<AdCampaign> ads = [];
  bool isLoading = false;
  bool isSaving = false;
  bool isSending = false;
  String? errorMessage;

  List<AdCampaign> get activeAds {
    final now = DateTime.now();
    final filtered = ads.where((ad) {
      final afterStart = ad.startDate == null || !ad.startDate!.isAfter(now);
      final beforeEnd = ad.endDate == null || !ad.endDate!.isBefore(now);
      return ad.isActive && afterStart && beforeEnd;
    }).toList();
    return _sortAds(filtered);
  }

  Future<void> loadAds({bool refresh = false}) async {
    isLoading = true;
    notifyListeners();
    try {
      ads = _sortAds(await _repository.getAds(force: refresh));
      errorMessage = null;
    } catch (error) {
      errorMessage = error.toString();
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> createAd({
    required String title,
    required String description,
    String? linkUrl,
    DateTime? startDate,
    DateTime? endDate,
    bool isActive = true,
    File? image,
  }) async {
    try {
      isSaving = true;
      notifyListeners();
      final ad = await _repository.createAd(
        title: title,
        description: description,
        linkUrl: linkUrl,
        startDate: startDate,
        endDate: endDate,
        isActive: isActive,
        image: image,
      );
      ads = _sortAds([ad, ...ads]);
      errorMessage = null;
      return true;
    } catch (error) {
      errorMessage = error.toString();
      return false;
    } finally {
      isSaving = false;
      notifyListeners();
    }
  }

  Future<void> deleteAd(int id) async {
    try {
      await _repository.deleteAd(id);
      ads = _sortAds(ads.where((ad) => ad.id != id).toList());
      errorMessage = null;
      notifyListeners();
    } catch (error) {
      errorMessage = error.toString();
      notifyListeners();
    }
  }

  Future<void> toggleAdStatus(AdCampaign ad) async {
    try {
      final updated = await _repository.updateAd(
        ad.id,
        {'isActive': !ad.isActive, 'is_active': !ad.isActive},
      );
      ads = _sortAds(
        ads.map((item) => item.id == ad.id ? updated : item).toList(),
      );
      errorMessage = null;
      notifyListeners();
    } catch (error) {
      errorMessage = error.toString();
      notifyListeners();
    }
  }

  Future<String?> sendAd(
    int id, {
    bool sendToAll = true,
    List<int>? userIds,
  }) async {
    try {
      isSending = true;
      notifyListeners();
      final response = await _repository.sendAd(
        id: id,
        sendToAll: sendToAll,
        userIds: userIds,
      );
      await loadAds(refresh: true);
      errorMessage = null;
      return response['message']?.toString();
    } catch (error) {
      errorMessage = error.toString();
      notifyListeners();
      return null;
    } finally {
      isSending = false;
      notifyListeners();
    }
  }

  List<AdCampaign> _sortAds(List<AdCampaign> source) {
    final sorted = [...source];
    sorted.sort(
      (a, b) => b.createdAt.compareTo(a.createdAt),
    );
    return sorted;
  }
}
