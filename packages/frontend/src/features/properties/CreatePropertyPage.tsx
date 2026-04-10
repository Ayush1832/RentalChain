import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../../services/api';

const schema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().max(2000).optional(),
  propertyType: z.enum(['APARTMENT', 'HOUSE', 'VILLA', 'COMMERCIAL', 'PG', 'OTHER']),
  addressLine1: z.string().min(5).max(300),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  pincode: z.string().regex(/^\d{6}$/, '6-digit pincode required'),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  areaSqft: z.number().int().min(1).optional(),
  monthlyRent: z.number().int().min(100),
  securityDeposit: z.number().int().min(0),
});
type FormData = z.infer<typeof schema>;

export function CreatePropertyPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { propertyType: 'APARTMENT', securityDeposit: 0 },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      // Convert rupees to paise
      return api.post('/properties', {
        ...data,
        monthlyRent: Math.round(data.monthlyRent * 100),
        securityDeposit: Math.round(data.securityDeposit * 100),
      });
    },
    onSuccess: (res) => {
      toast.success('Property listed!');
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      navigate(`/properties/${res.data.property.id}`);
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message ?? 'Failed to create listing'),
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">List a Property</h1>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <h2 className="font-semibold text-gray-700">Basic Details</h2>

          <div>
            <label className="label">Title</label>
            <input {...register('title')} placeholder="2BHK in Koramangala, Bengaluru" className="input" />
            {errors.title && <p className="error">{errors.title.message}</p>}
          </div>

          <div>
            <label className="label">Property Type</label>
            <select {...register('propertyType')} className="input">
              {['APARTMENT', 'HOUSE', 'VILLA', 'COMMERCIAL', 'PG', 'OTHER'].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Description (optional)</label>
            <textarea {...register('description')} rows={3} className="input resize-none" placeholder="Describe the property…" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <h2 className="font-semibold text-gray-700">Address</h2>

          <div>
            <label className="label">Address Line 1</label>
            <input {...register('addressLine1')} placeholder="Flat 4B, Sunrise Apartments, MG Road" className="input" />
            {errors.addressLine1 && <p className="error">{errors.addressLine1.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">City</label>
              <input {...register('city')} placeholder="Bengaluru" className="input" />
              {errors.city && <p className="error">{errors.city.message}</p>}
            </div>
            <div>
              <label className="label">State</label>
              <input {...register('state')} placeholder="Karnataka" className="input" />
            </div>
          </div>

          <div>
            <label className="label">Pincode</label>
            <input {...register('pincode')} placeholder="560001" maxLength={6} className="input w-32" />
            {errors.pincode && <p className="error">{errors.pincode.message}</p>}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <h2 className="font-semibold text-gray-700">Size &amp; Pricing</h2>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Bedrooms</label>
              <input {...register('bedrooms', { valueAsNumber: true })} type="number" min="0" className="input" />
            </div>
            <div>
              <label className="label">Bathrooms</label>
              <input {...register('bathrooms', { valueAsNumber: true })} type="number" min="0" className="input" />
            </div>
            <div>
              <label className="label">Area (sq ft)</label>
              <input {...register('areaSqft', { valueAsNumber: true })} type="number" min="0" className="input" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Monthly Rent (₹)</label>
              <input {...register('monthlyRent', { valueAsNumber: true })} type="number" min="100" className="input" />
              {errors.monthlyRent && <p className="error">{errors.monthlyRent.message}</p>}
            </div>
            <div>
              <label className="label">Security Deposit (₹)</label>
              <input {...register('securityDeposit', { valueAsNumber: true })} type="number" min="0" className="input" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={mutation.isPending} className="btn-primary w-full">
          {mutation.isPending ? 'Listing…' : 'List Property'}
        </button>
      </form>
    </div>
  );
}
