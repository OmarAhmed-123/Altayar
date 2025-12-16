import 'dart:io';

import 'package:altayar/features/ad_manager/data/ad_api.dart';
import 'package:altayar/features/ad_manager/data/models/ad_campaign.dart';

class AdRepository {
  AdRepository(this._api);

  final AdApi _api;

  List<AdCampaign>? _cache;

  Future<List<AdCampaign>> getAds({bool force = false}) async {
    if (!force && _cache != null) return _cache!;
    final ads = await _api.fetchAds();
    _cache = ads;
    return ads;
  }

  Future<AdCampaign> createAd({
    required String title,
    required String description,
    bool isActive = true,
    String? linkUrl,
    DateTime? startDate,
    DateTime? endDate,
    File? image,
  }) async {
    final ad = await _api.createAd(
      title: title,
      description: description,
      isActive: isActive,
      linkUrl: linkUrl,
      startDate: startDate,
      endDate: endDate,
      image: image,
    );
    final existing = _cache ?? const <AdCampaign>[];
    _cache = [ad, ...existing];
    return ad;
  }

  Future<void> deleteAd(int id) async {
    await _api.deleteAd(id);
    _cache = _cache?.where((ad) => ad.id != id).toList();
  }

  Future<AdCampaign> updateAd(int id, Map<String, dynamic> payload) async {
    final updated = await _api.updateAd(id, payload);
    _cache = _cache?.map((ad) => ad.id == id ? updated : ad).toList();
    return updated;
  }

  Future<Map<String, dynamic>> sendAd({
    required int id,
    bool sendToAll = true,
    List<int>? userIds,
  }) {
    return _api.sendAd(
      id,
      sendToAll: sendToAll,
      userIds: userIds,
    );
  }
}
