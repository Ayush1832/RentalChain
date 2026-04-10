import { db } from './db';
import { encrypt, decrypt } from '../utils/crypto';
import { PropertyType, ListingStatus } from '../types';

export interface Property {
  id: string;
  landlordId: string;
  title: string;
  description?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  propertyType: PropertyType;
  bedrooms?: number;
  bathrooms?: number;
  areaSqft?: number;
  monthlyRent: number;
  securityDeposit?: number;
  isFurnished: boolean;
  amenities: string[];
  listingStatus: ListingStatus;
  isVerified: boolean;
  images?: { id: string; ipfsCid: string; cloudUrl?: string; isPrimary: boolean }[];
  createdAt: Date;
  updatedAt: Date;
}

function rowToProperty(row: Record<string, unknown>): Property {
  return {
    id: row.id as string,
    landlordId: row.landlord_id as string,
    title: row.title as string,
    description: (row.description as string) || undefined,
    addressLine1: decrypt(row.address_line1 as string),
    addressLine2: row.address_line2 ? decrypt(row.address_line2 as string) : undefined,
    city: row.city as string,
    state: row.state as string,
    pincode: row.pincode as string,
    propertyType: row.property_type as PropertyType,
    bedrooms: (row.bedrooms as number) || undefined,
    bathrooms: (row.bathrooms as number) || undefined,
    areaSqft: (row.area_sqft as number) || undefined,
    monthlyRent: row.monthly_rent as number,
    securityDeposit: (row.security_deposit as number) || undefined,
    isFurnished: row.is_furnished as boolean,
    amenities: (row.amenities as string[]) || [],
    listingStatus: row.listing_status as ListingStatus,
    isVerified: row.is_verified as boolean,
    createdAt: row.created_at as Date,
    updatedAt: row.updated_at as Date,
  };
}

export async function createProperty(data: {
  landlordId: string;
  title: string;
  description?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  propertyType: PropertyType;
  bedrooms?: number;
  bathrooms?: number;
  areaSqft?: number;
  monthlyRent: number;
  securityDeposit?: number;
  isFurnished?: boolean;
  amenities?: string[];
}): Promise<Property> {
  const result = await db.query(
    `INSERT INTO properties
     (landlord_id, title, description, address_line1, address_line2, city, state, pincode,
      property_type, bedrooms, bathrooms, area_sqft, monthly_rent, security_deposit,
      is_furnished, amenities, listing_status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'DRAFT')
     RETURNING *`,
    [
      data.landlordId, data.title, data.description || null,
      encrypt(data.addressLine1), data.addressLine2 ? encrypt(data.addressLine2) : null,
      data.city, data.state, data.pincode, data.propertyType,
      data.bedrooms || null, data.bathrooms || null, data.areaSqft || null,
      data.monthlyRent, data.securityDeposit || null,
      data.isFurnished ?? false, JSON.stringify(data.amenities ?? []),
    ]
  );
  return rowToProperty(result.rows[0]);
}

export async function getPropertyById(id: string): Promise<Property | null> {
  const result = await db.query(`SELECT * FROM properties WHERE id = $1`, [id]);
  if (!result.rows.length) return null;
  const property = rowToProperty(result.rows[0]);
  property.images = await getPropertyImages(id);
  return property;
}

export async function listProperties(filters: {
  city?: string;
  minRent?: number;
  maxRent?: number;
  propertyType?: PropertyType;
  bedrooms?: number;
  landlordId?: string;
  status?: ListingStatus;
  page?: number;
  limit?: number;
}): Promise<{ properties: Property[]; total: number }> {
  const conditions: string[] = ["listing_status != 'INACTIVE'"];
  const values: unknown[] = [];
  let idx = 1;

  if (filters.city) { conditions.push(`LOWER(city) = LOWER($${idx++})`); values.push(filters.city); }
  if (filters.minRent) { conditions.push(`monthly_rent >= $${idx++}`); values.push(filters.minRent); }
  if (filters.maxRent) { conditions.push(`monthly_rent <= $${idx++}`); values.push(filters.maxRent); }
  if (filters.propertyType) { conditions.push(`property_type = $${idx++}`); values.push(filters.propertyType); }
  if (filters.bedrooms) { conditions.push(`bedrooms = $${idx++}`); values.push(filters.bedrooms); }
  if (filters.landlordId) { conditions.push(`landlord_id = $${idx++}`); values.push(filters.landlordId); }
  if (filters.status) { conditions.push(`listing_status = $${idx++}`); values.push(filters.status); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = filters.limit || 20;
  const offset = ((filters.page || 1) - 1) * limit;

  const [rows, countResult] = await Promise.all([
    db.query(`SELECT * FROM properties ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
      [...values, limit, offset]),
    db.query(`SELECT COUNT(*) FROM properties ${where}`, values),
  ]);

  return {
    properties: rows.rows.map(rowToProperty),
    total: parseInt(countResult.rows[0].count),
  };
}

export async function updateProperty(
  id: string,
  updates: Partial<Omit<Property, 'id' | 'landlordId' | 'createdAt' | 'updatedAt'>>
): Promise<Property> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  const map: Record<string, unknown> = {
    title: updates.title,
    description: updates.description,
    city: updates.city,
    state: updates.state,
    pincode: updates.pincode,
    property_type: updates.propertyType,
    bedrooms: updates.bedrooms,
    bathrooms: updates.bathrooms,
    area_sqft: updates.areaSqft,
    monthly_rent: updates.monthlyRent,
    security_deposit: updates.securityDeposit,
    is_furnished: updates.isFurnished,
    listing_status: updates.listingStatus,
  };
  if (updates.addressLine1) map['address_line1'] = encrypt(updates.addressLine1);
  if (updates.addressLine2) map['address_line2'] = encrypt(updates.addressLine2);
  if (updates.amenities) map['amenities'] = JSON.stringify(updates.amenities);

  for (const [col, val] of Object.entries(map)) {
    if (val !== undefined) { fields.push(`${col} = $${idx++}`); values.push(val); }
  }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await db.query(
    `UPDATE properties SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return rowToProperty(result.rows[0]);
}

export async function addPropertyImage(data: {
  propertyId: string;
  ipfsCid: string;
  cloudUrl?: string;
  isPrimary?: boolean;
}): Promise<void> {
  if (data.isPrimary) {
    await db.query(`UPDATE property_images SET is_primary = FALSE WHERE property_id = $1`, [data.propertyId]);
  }
  await db.query(
    `INSERT INTO property_images (property_id, ipfs_cid, cloud_url, is_primary) VALUES ($1,$2,$3,$4)`,
    [data.propertyId, data.ipfsCid, data.cloudUrl || null, data.isPrimary ?? false]
  );
}

async function getPropertyImages(propertyId: string) {
  const result = await db.query(
    `SELECT id, ipfs_cid, cloud_url, is_primary FROM property_images WHERE property_id = $1 ORDER BY is_primary DESC`,
    [propertyId]
  );
  return result.rows.map((r) => ({
    id: r.id,
    ipfsCid: r.ipfs_cid,
    cloudUrl: r.cloud_url,
    isPrimary: r.is_primary,
  }));
}
