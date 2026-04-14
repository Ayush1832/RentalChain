export type UserRole = 'TENANT' | 'LANDLORD' | 'BOTH' | 'ADMIN' | 'MEDIATOR';
export type KYCStatus = 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
export type AgreementStatus = 'DRAFT' | 'PENDING_SIGNATURES' | 'ACTIVE' | 'TERMINATED' | 'EXPIRED';
export type PaymentMethod = 'UPI' | 'BANK_TRANSFER' | 'CASH' | 'CHEQUE';
export type EvidenceType = 'MOVE_IN' | 'MOVE_OUT' | 'MAINTENANCE' | 'INSPECTION';
export type DisputeType = 'DEPOSIT_REFUND' | 'PROPERTY_DAMAGE' | 'UNPAID_RENT' | 'AGREEMENT_BREACH' | 'OTHER';
export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';
export type PropertyType = 'APARTMENT' | 'HOUSE' | 'VILLA' | 'COMMERCIAL' | 'PG' | 'OTHER';
export type ListingStatus = 'DRAFT' | 'ACTIVE' | 'RENTED' | 'INACTIVE';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface User {
  id: string;
  phone: string;
  fullName?: string;
  email?: string;
  role: UserRole;
  kycStatus: KYCStatus;
  didHash?: string;
  reputationScore?: number;
  createdAt: string;
}

export interface Property {
  id: string;
  landlordId: string;
  title: string;
  description?: string;
  propertyType: PropertyType;
  addressLine1: string;
  city: string;
  state: string;
  pincode: string;
  bedrooms?: number;
  bathrooms?: number;
  areaSqft?: number;
  monthlyRent: number;
  securityDeposit: number;
  listingStatus: ListingStatus;
  isFurnished?: boolean;
  amenities?: string[];
  images?: PropertyImage[];
  createdAt: string;
}

export interface PropertyImage {
  id: string;
  cloudUrl: string;
  ipfsCid?: string;
}

export interface Agreement {
  id: string;
  propertyId: string;
  landlordId: string;
  tenantId: string;
  status: AgreementStatus;
  monthlyRent: number;
  securityDeposit: number;
  startDate: string;
  endDate?: string;
  noticePeriodDays: number;
  rentDueDay: number;
  pdfCloudUrl?: string;
  landlordSignedAt?: string;
  tenantSignedAt?: string;
  agreementHash?: string;
  blockchainTxHash?: string;
  blockchainAnchoredAt?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  agreementId: string;
  tenantId: string;
  landlordId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentMonth: string;
  paymentDate: string;
  upiRefId?: string;
  notes?: string;
  receiptCloudUrl?: string;
  paymentHash?: string;
  blockchainTxHash?: string;
  status: 'PENDING' | 'CONFIRMED' | 'DISPUTED';
  createdAt: string;
}

export interface Evidence {
  id: string;
  agreementId: string;
  uploadedBy: string;
  evidenceType: EvidenceType;
  ipfsCidBundle?: string;
  cloudUrls: string[];
  description?: string;
  evidenceHash?: string;
  blockchainTxHash?: string;
  blockchainAnchoredAt?: string;
  createdAt: string;
}

export interface MaintenanceTicket {
  id: string;
  agreementId: string;
  raisedBy: string;
  title: string;
  description: string;
  category?: string;
  priority: TicketPriority;
  status: TicketStatus;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Dispute {
  id: string;
  agreementId: string;
  raisedBy: string;
  againstUserId: string;
  disputeType: DisputeType;
  description: string;
  status: DisputeStatus;
  blockchainTxHash?: string;
  outcome?: string;
  resolutionNotes?: string;
  resolvedAt?: string;
  createdAt: string;
}
