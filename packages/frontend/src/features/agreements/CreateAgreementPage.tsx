import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import type { Property } from '../../types';

const schema = z.object({
  propertyId: z.string().uuid('Select a property'),
  tenantPhone: z.string().regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit Indian mobile number'),
  monthlyRent: z.number().int().min(100, 'Enter monthly rent in ₹'),
  securityDeposit: z.number().int().min(0),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  noticePeriodDays: z.number().int().min(7).max(180).optional(),
  rentDueDay: z.number().int().min(1).max(28).optional(),
});
type FormData = z.infer<typeof schema>;

export function CreateAgreementPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const defaultPropertyId = searchParams.get('propertyId') ?? '';

  const { data: propertiesData } = useQuery({
    queryKey: ['properties', 'my'],
    queryFn: () => api.get<{ properties: Property[] }>('/properties?listingStatus=ACTIVE').then((r) => r.data.properties),
  });

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      propertyId: defaultPropertyId,
      securityDeposit: 0,
      noticePeriodDays: 30,
      rentDueDay: 5,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Look up tenant by phone first
      const tenantRes = await api.get<{ user: { id: string } }>(`/users/by-phone?phone=${data.tenantPhone}`).catch(() => null);
      if (!tenantRes) throw new Error('Tenant not found. Ask them to register on RentalChain first.');

      return api.post('/agreements', {
        propertyId: data.propertyId,
        tenantId: tenantRes.data.user.id,
        monthlyRent: Math.round(data.monthlyRent * 100),
        securityDeposit: Math.round(data.securityDeposit * 100),
        startDate: data.startDate,
        endDate: data.endDate || undefined,
        noticePeriodDays: data.noticePeriodDays,
        rentDueDay: data.rentDueDay,
      });
    },
    onSuccess: (res) => {
      toast.success('Agreement created! Generate the PDF next.');
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      navigate(`/agreements/${res.data.agreement.id}`);
    },
    onError: (err: any) => {
      toast.error(err.message ?? err.response?.data?.error?.message ?? 'Failed to create agreement');
    },
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Rental Agreement</h1>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <h2 className="font-semibold text-gray-700">Parties</h2>

          <div>
            <label className="label">Property</label>
            <select {...register('propertyId')} className="input">
              <option value="">Select a property…</option>
              {propertiesData?.map((p) => (
                <option key={p.id} value={p.id}>{p.title} — {p.city}</option>
              ))}
            </select>
            {errors.propertyId && <p className="error">{errors.propertyId.message}</p>}
          </div>

          <div>
            <label className="label">Tenant's Mobile Number</label>
            <input
              {...register('tenantPhone')}
              placeholder="9876543210"
              maxLength={10}
              className="input font-mono"
            />
            <p className="text-xs text-gray-400 mt-1">The tenant must already have a RentalChain account</p>
            {errors.tenantPhone && <p className="error">{errors.tenantPhone.message}</p>}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <h2 className="font-semibold text-gray-700">Terms</h2>

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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date</label>
              <input {...register('startDate')} type="date" className="input" />
              {errors.startDate && <p className="error">{errors.startDate.message}</p>}
            </div>
            <div>
              <label className="label">End Date (optional)</label>
              <input {...register('endDate')} type="date" className="input" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Notice Period (days)</label>
              <input {...register('noticePeriodDays', { valueAsNumber: true })} type="number" min="7" max="180" className="input" />
            </div>
            <div>
              <label className="label">Rent Due Day (1-28)</label>
              <input {...register('rentDueDay', { valueAsNumber: true })} type="number" min="1" max="28" className="input" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={mutation.isPending} className="btn-primary w-full">
          {mutation.isPending ? 'Creating…' : 'Create Agreement'}
        </button>
      </form>
    </div>
  );
}
