/**
 * Helpers for unifying the different response shapes ({ data }, ApiResponse<T>, raw T).
 */
export type ApiPayload<T> =
  | T
  | null
  | undefined
  | { data?: T | null | undefined }
  | { success?: boolean; data?: T | null | undefined };

export const extractData = <T>(payload: ApiPayload<T>): T | null => {
  if (payload === null || payload === undefined) {
    return null;
  }

  if (typeof payload === 'object' && 'data' in payload) {
    const value = (payload as { data?: T | null }).data;
    return (value === undefined ? null : value) as T | null;
  }

  return payload as T;
};

export const extractArray = <T>(payload: ApiPayload<T[]>): T[] => {
  const data = extractData(payload);
  return Array.isArray(data) ? data : [];
};

export const extractWithFallback = <T>(payload: ApiPayload<T>, fallback: T): T => {
  const data = extractData(payload);
  return (data ?? fallback) as T;
};

