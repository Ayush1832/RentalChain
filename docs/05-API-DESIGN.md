# RentalChain — API Design

## Base URL

```
https://api.rentalchain.in/v1
```

## Authentication

All protected endpoints require:
```
Authorization: Bearer <JWT_ACCESS_TOKEN>
```

JWT payload:
```json
{
  "userId": "uuid",
  "role": "TENANT | LANDLORD | BOTH | ADMIN | MEDIATOR",
  "didHash": "0x...",
  "iat": 1234567890,
  "exp": 1234567890
}
```

---

## Auth Endpoints

```
POST /auth/send-otp
POST /auth/verify-otp
POST /auth/refresh
POST /auth/logout
```

### POST /auth/send-otp
```json
// Request
{ "phone": "9876543210" }

// Response
{ "message": "OTP sent", "expiresIn": 300 }
```

### POST /auth/verify-otp
```json
// Request
{ "phone": "9876543210", "otp": "123456" }

// Response
{
  "accessToken": "jwt...",
  "refreshToken": "jwt...",
  "user": { "id": "uuid", "role": "TENANT", "kycStatus": "PENDING" }
}
```

---

## User Endpoints

```
GET    /users/me
PUT    /users/me
POST   /users/me/kyc
GET    /users/me/reputation
GET    /users/:id/public-profile
```

### POST /users/me/kyc
```json
// Request (multipart/form-data)
{
  "aadhaarNumber": "XXXX XXXX XXXX",
  "panNumber": "ABCDE1234F",
  "aadhaarFront": <file>,
  "aadhaarBack": <file>,
  "panCard": <file>
}

// Response
{ "kycStatus": "PENDING", "message": "KYC submitted for review" }
```

---

## Property Endpoints

```
GET    /properties                    // list with filters
POST   /properties                    // landlord creates listing
GET    /properties/:id
PUT    /properties/:id
DELETE /properties/:id
POST   /properties/:id/images
GET    /properties/:id/images
```

### GET /properties (query params)
```
?city=Bangalore
&minRent=10000
&maxRent=30000
&type=APARTMENT
&bedrooms=2
&page=1
&limit=20
```

### POST /properties
```json
{
  "title": "2BHK in Koramangala",
  "addressLine1": "123 5th Block",
  "city": "Bangalore",
  "state": "Karnataka",
  "pincode": "560034",
  "propertyType": "APARTMENT",
  "bedrooms": 2,
  "bathrooms": 2,
  "areaSqft": 900,
  "monthlyRent": 2500000,       // in paise (₹25,000)
  "securityDeposit": 5000000,   // in paise (₹50,000)
  "isFurnished": true,
  "amenities": ["PARKING", "WIFI", "WATER"]
}
```

---

## Agreement Endpoints

```
POST   /agreements                    // initiate agreement creation
GET    /agreements/:id
GET    /agreements                    // list for current user
POST   /agreements/:id/generate-pdf  // generate the legal PDF
POST   /agreements/:id/sign          // e-sign the agreement
GET    /agreements/:id/verify        // verify on-chain
POST   /agreements/:id/terminate
```

### POST /agreements
```json
{
  "propertyId": "uuid",
  "tenantId": "uuid",
  "monthlyRent": 2500000,
  "securityDeposit": 5000000,
  "startDate": "2025-02-01",
  "endDate": "2026-01-31",
  "noticePeriodDays": 30,
  "rentDueDay": 5
}
```

### POST /agreements/:id/sign
```json
{
  "method": "OTP",        // or "AADHAAR_ESIGN"
  "otp": "123456"
}
// Response — after both parties sign:
{
  "status": "ACTIVE",
  "agreementHash": "0xabc...",
  "blockchainTxHash": "0xdef...",
  "ipfsCid": "Qm...",
  "anchoredAt": "2025-01-15T10:30:00Z"
}
```

### GET /agreements/:id/verify
```json
// Response
{
  "agreementId": "uuid",
  "onChainAgreementId": "0x...",
  "agreementHash": "0xabc...",
  "blockchainTxHash": "0xdef...",
  "anchoredAt": "2025-01-15T10:30:00Z",
  "landlordDID": "0x...",
  "tenantDID": "0x...",
  "sepoliaExplorerUrl": "https://sepolia.etherscan.io/tx/0xdef..."
}
```

---

## Payment Endpoints

```
POST   /agreements/:id/payments      // record a payment
GET    /agreements/:id/payments      // list all payments for agreement
GET    /payments/:id
POST   /payments/:id/confirm         // landlord confirms receipt
GET    /payments/:id/verify          // verify on-chain
```

### POST /agreements/:id/payments
```json
{
  "amount": 2500000,                 // in paise
  "paymentDate": "2025-01-05",
  "paymentMonth": "2025-01",
  "upiRefId": "UPI123456789",
  "paymentMethod": "UPI",
  "notes": "January 2025 rent"
}
// Optionally attach receipt: multipart/form-data with receipt file
```

---

## Evidence Endpoints

```
POST   /agreements/:id/evidence      // upload evidence
GET    /agreements/:id/evidence      // list all evidence
GET    /evidence/:id
GET    /evidence/:id/verify          // verify on-chain
```

### POST /agreements/:id/evidence (multipart/form-data)
```json
{
  "evidenceType": "MOVE_IN",        // MOVE_IN | MOVE_OUT | MAINTENANCE | INSPECTION
  "description": "Move-in condition photos",
  "maintenanceTicketId": null,
  "photos": [<file1>, <file2>, ...]
}
```

---

## Maintenance Endpoints

```
POST   /agreements/:id/maintenance   // raise a ticket
GET    /agreements/:id/maintenance   // list tickets
GET    /maintenance/:id
PUT    /maintenance/:id              // update status / resolve
```

---

## Dispute Endpoints

```
POST   /disputes                     // raise a dispute
GET    /disputes/:id
GET    /disputes                     // list user's disputes
PUT    /disputes/:id/resolve         // mediator resolves
```

### POST /disputes
```json
{
  "agreementId": "uuid",
  "disputeType": "DEPOSIT_REFUND",
  "description": "Landlord refusing to return deposit despite clean move-out.",
  "attachedEvidenceIds": ["uuid1", "uuid2"]
}
```

---

## Verification / Public Endpoints

```
GET    /verify/agreement/:onChainId   // public verification by on-chain ID
GET    /verify/payment/:txHash        // public payment verification
GET    /verify/evidence/:txHash       // public evidence verification
```

These endpoints are **public** (no auth required) and allow anyone to independently verify a rental event using only the transaction hash or on-chain ID. This is a key trust feature.

---

## Admin Endpoints

```
GET    /admin/kyc/pending            // list pending KYC
POST   /admin/kyc/:userId/approve
POST   /admin/kyc/:userId/reject
GET    /admin/disputes               // all disputes
PUT    /admin/disputes/:id/assign    // assign mediator
GET    /admin/users
GET    /admin/analytics
```

---

## Error Response Format

```json
{
  "error": {
    "code": "AGREEMENT_NOT_FOUND",
    "message": "Agreement with id 'abc' not found",
    "statusCode": 404
  }
}
```

## Standard Error Codes

| Code | HTTP | Meaning |
|---|---|---|
| `UNAUTHORIZED` | 401 | Invalid or missing JWT |
| `FORBIDDEN` | 403 | Insufficient role/permission |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request body |
| `KYC_REQUIRED` | 403 | Action requires verified KYC |
| `AGREEMENT_NOT_ACTIVE` | 400 | Action requires active agreement |
| `ALREADY_SIGNED` | 400 | Party has already signed |
| `BLOCKCHAIN_ERROR` | 500 | On-chain anchoring failed |
| `DUPLICATE_PAYMENT` | 400 | Payment for this month already recorded |

---

## Rate Limiting

| Endpoint Group | Limit |
|---|---|
| Auth endpoints | 10 req/min per IP |
| General API | 100 req/min per user |
| File upload | 20 req/min per user |
| Public verify | 60 req/min per IP |
