import { Request } from 'express';

export type UserRole = 'TENANT' | 'LANDLORD' | 'BOTH' | 'ADMIN' | 'MEDIATOR';
export type KYCStatus = 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
export type AgreementStatus = 'DRAFT' | 'PENDING_SIGNATURES' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
export type PaymentStatus = 'PENDING' | 'CONFIRMED' | 'DISPUTED';
export type PaymentMethod = 'UPI' | 'BANK_TRANSFER' | 'CASH' | 'CHEQUE';
export type EvidenceType = 'MOVE_IN' | 'MOVE_OUT' | 'MAINTENANCE' | 'INSPECTION';
export type DisputeType = 'DEPOSIT_REFUND' | 'PROPERTY_DAMAGE' | 'UNPAID_RENT' | 'AGREEMENT_BREACH' | 'OTHER';
export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';
export type PropertyType = 'APARTMENT' | 'HOUSE' | 'PG' | 'COMMERCIAL';
export type ListingStatus = 'DRAFT' | 'ACTIVE' | 'RENTED' | 'INACTIVE';

export interface JWTPayload {
  userId: string;
  role: UserRole;
  didHash?: string;
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
}

export interface BlockchainTxResult {
  txHash: string;
  blockNumber: number;
  timestamp: number;
  gasUsed: string;
}
