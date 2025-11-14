import { useAuthStore } from '@/store/auth';

/**
 * Get current user ID from auth store
 * Falls back to hardcoded value for demo purposes
 */
export const useCurrentUserId = (): string => {
  const user = useAuthStore((state) => state.user);
  
  // Return user ID from auth store if available, otherwise fallback
  return user?._id || "68d8d10919e38bef7a50c1db";
};