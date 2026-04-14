export const Colors = {
  primary: '#1D4ED8',
  primaryLight: '#3B82F6',
  primaryDark: '#1E3A8A',
  success: '#16A34A',
  warning: '#D97706',
  error: '#DC2626',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  white: '#FFFFFF',
  black: '#000000',
};

export const StatusColors: Record<string, string> = {
  // Agreement
  DRAFT: Colors.gray[400],
  PENDING_SIGNATURES: Colors.warning,
  ACTIVE: Colors.success,
  TERMINATED: Colors.error,
  EXPIRED: Colors.gray[500],
  // Payment
  PENDING: Colors.warning,
  CONFIRMED: Colors.success,
  DISPUTED: Colors.error,
  // KYC
  SUBMITTED: Colors.primaryLight,
  VERIFIED: Colors.success,
  REJECTED: Colors.error,
  // Dispute
  OPEN: Colors.error,
  UNDER_REVIEW: Colors.warning,
  RESOLVED: Colors.success,
  CLOSED: Colors.gray[500],
  // Ticket
  IN_PROGRESS: Colors.primaryLight,
};
