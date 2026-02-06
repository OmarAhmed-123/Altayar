/**
 * Voucher Service
 * Uses the unified API client
 */
import { API } from './apiClient';
import type { Voucher } from './apiClient';

// Re-export Voucher type
export type { Voucher } from './apiClient';

export const voucherService = {
  getMyVouchers: API.voucher.getMyVouchers,
  getAllVouchers: API.voucher.getAllVouchers,
  useVoucher: API.voucher.useVoucher,
  createManualVoucher: API.voucher.createManualVoucher,
};
