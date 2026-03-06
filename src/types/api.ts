/**
 * API Response Types
 * Standardized response structures for all API endpoints
 */

/**
 * Base API Response
 * All API responses should follow this structure
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

/**
 * Paginated API Response
 * Used for list endpoints that support pagination
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * API Error Response
 * Standardized error structure
 */
export interface ApiError {
  message: string;
  statusCode: number;
  error: string;
  timestamp: string;
  path: string;
  method?: string;
  details?: Record<string, unknown>;
}

/**
 * Query Parameters for Paginated Requests
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Query Parameters for Filtered Requests
 */
export interface FilterParams extends PaginationParams {
  search?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  [key: string]: string | number | boolean | undefined;
}

/**
 * Common Status Values
 */
export type Status = 'active' | 'inactive' | 'pending' | 'archived';

/**
 * API Request State
 * For tracking request lifecycle in UI
 */
export interface RequestState<T = unknown> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  isSuccess: boolean;
  isError: boolean;
}

/**
 * Mutation Response
 * For create/update/delete operations
 */
export interface MutationResponse {
  id?: string;
  message: string;
  success: boolean;
}
