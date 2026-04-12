import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import type { Property } from '../../types';

const schema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().max(2000).optional(),
  addressLine1: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().regex(/^\d{6}$/),
  propertyType: z.enum(['APARTMENT', 'HOUSE', 'PG', 'COMMERCIAL']),
  bedrooms: z.coerce.number().int().min(0).max(20).optional(),
  bathrooms: z.coerce.number().int().min(0).max(10).optional(),
  areaSqft: z.coerce.number().int().min(50).optional(),
  monthlyRent: z.coerce.number().int().positive(),
  securityDeposit: z.coerce.number().int().min(0).optional(),
  isFurnished: z.boolean().optional(),
  listingStatus: z.enum(['DRAFT', 'ACTIVE', 'RENTED', 'INACTIVE']),
});
type FormData = z.infer<typeof schema>;

export function EditPropertyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: () => api.get<{ property: Property }>(`/properties/${id}`).then(r => r.data.property),
    enabled: !!id,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (data) {
      reset({
        title: data.title,
        description: data.description ?? '',
        addressLine1: data.addressLine1,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        propertyType: data.propertyType as any,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        areaSqft: data.areaSqft,
        monthlyRent: data.monthlyRent / 100,
        securityDeposit: data.securityDeposit ? data.securityDeposit / 100 : undefined,
        isFurnished: data.isFurnished ?? false,
        listingStatus: data.listingStatus as any,
      });
    }
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: (formData: FormData) =>
      api.put(`/properties/${id}`, {
        ...formData,
        monthlyRent: Math.round(formData.monthlyRent * 100),
        securityDeposit: formData.securityDeposit ? Math.round(formData.securityDeposit * 100) : undefined,
      }),
    onSuccess: () => {
      toast.success('Property updated');
      navigate(`/properties/${id}`);
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message ?? 'Update failed'),
  });

  if (isLoading) return <div className="text-center py-16 text-gray-400">Loading…</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to={`/properties/${id}`} className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Property</h1>
      </div>

      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Basic Information</h2>
          <div>
            <label className="label">Title</label>
            <input {...register('title')} className="input" placeholder="e.g. 2BHK Apartment in Koramangala" />
            {errors.title && <p className="error">{errors.title.message}</p>}
          </div>
          <div>
            <label className="label">Description</label>
            <textarea {...register('description')} rows={3} className="input resize-none" placeholder="Property details…" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Type</label>
              <select {...register('propertyType')} className="input">
                <option value="APARTMENT">Apartment</option>
                <option value="HOUSE">House</option>
                <option value="PG">PG</option>
                <option value="COMMERCIAL">Commercial</option>
              </select>
            </div>
            <div>
              <label className="label">Listing Status</label>
              <select {...register('listingStatus')} className="input">
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="RENTED">Rented</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Location</h2>
          <div>
            <label className="label">Address Line 1</label>
            <input {...register('addressLine1')} className="input" />
            {errors.addressLine1 && <p className="error">{errors.addressLine1.message}</p>}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">City</label>
              <input {...register('city')} className="input" />
            </div>
            <div>
              <label className="label">State</label>
              <input {...register('state')} className="input" />
            </div>
            <div>
              <label className="label">Pincode</label>
              <input {...register('pincode')} className="input" maxLength={6} />
              {errors.pincode && <p className="error">{errors.pincode.message}</p>}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Details & Pricing</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Bedrooms</label>
              <input {...register('bedrooms')} type="number" min={0} max={20} className="input" />
            </div>
            <div>
              <label className="label">Bathrooms</label>
              <input {...register('bathrooms')} type="number" min={0} max={10} className="input" />
            </div>
            <div>
              <label className="label">Area (sqft)</label>
              <input {...register('areaSqft')} type="number" min={50} className="input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Monthly Rent (₹)</label>
              <input {...register('monthlyRent')} type="number" step={100} className="input" />
              {errors.monthlyRent && <p className="error">{errors.monthlyRent.message}</p>}
            </div>
            <div>
              <label className="label">Security Deposit (₹)</label>
              <input {...register('securityDeposit')} type="number" step={100} className="input" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input {...register('isFurnished')} type="checkbox" id="furnished" className="w-4 h-4 rounded" />
            <label htmlFor="furnished" className="text-sm text-gray-700">Furnished</label>
          </div>
        </div>

        <button type="submit" disabled={mutation.isPending} className="btn-primary w-full py-3">
          {mutation.isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
