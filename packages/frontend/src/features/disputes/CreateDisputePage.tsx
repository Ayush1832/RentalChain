import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { AnchoringProgress } from '../../components/blockchain/AnchoringProgress';
import { useState } from 'react';
import type { Agreement } from '../../types';

const schema = z.object({
  agreementId: z.string().uuid('Select an agreement'),
  againstUserId: z.string().uuid('Select the other party'),
  disputeType: z.enum(['DEPOSIT_REFUND', 'PROPERTY_DAMAGE', 'UNPAID_RENT', 'AGREEMENT_BREACH', 'OTHER']),
  description: z.string().min(20, 'Describe the dispute in detail (min 20 chars)').max(2000),
});
type FormData = z.infer<typeof schema>;

const TYPE_LABELS: Record<string, string> = {
  DEPOSIT_REFUND: 'Security Deposit Refund',
  PROPERTY_DAMAGE: 'Property Damage',
  UNPAID_RENT: 'Unpaid Rent',
  AGREEMENT_BREACH: 'Agreement Breach',
  OTHER: 'Other',
};

export function CreateDisputePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const defaultAgreementId = searchParams.get('agreementId') ?? '';
  const [anchoringStep, setAnchoringStep] = useState<number | null>(null);

  const { data: agreements } = useQuery({
    queryKey: ['agreements'],
    queryFn: () => api.get<{ agreements: Agreement[] }>('/agreements').then(r => r.data.agreements),
  });

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { agreementId: defaultAgreementId, disputeType: 'DEPOSIT_REFUND' },
  });

  const selectedAgreementId = watch('agreementId');
  const selectedAgreement = agreements?.find(a => a.id === selectedAgreementId);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      setAnchoringStep(0);
      const res = await api.post('/disputes', data);
      setAnchoringStep(2);
      return res;
    },
    onSuccess: (res) => {
      setAnchoringStep(3);
      toast.success('Dispute raised and anchoring on blockchain…');
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      setTimeout(() => navigate(`/disputes/${res.data.dispute.id}`), 1500);
    },
    onError: (err: any) => {
      setAnchoringStep(null);
      toast.error(err.response?.data?.error?.message ?? 'Failed to raise dispute');
    },
  });

  const activeAgreements = agreements?.filter(a => a.status === 'ACTIVE') ?? [];

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Raise a Dispute</h1>
      <p className="text-sm text-gray-500 mb-6">
        Disputes are anchored on Ethereum as immutable records. A mediator will review and resolve.
      </p>

      {anchoringStep !== null && (
        <div className="mb-6">
          <AnchoringProgress currentStep={anchoringStep} />
        </div>
      )}

      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-5">
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <div>
            <label className="label">Agreement</label>
            <select {...register('agreementId')} className="input">
              <option value="">Select an active agreement…</option>
              {activeAgreements.map(a => (
                <option key={a.id} value={a.id}>
                  Agreement {a.id.slice(0, 8)}… · ₹{(a.monthlyRent / 100).toLocaleString('en-IN')}/mo
                </option>
              ))}
            </select>
            {errors.agreementId && <p className="error">{errors.agreementId.message}</p>}
          </div>

          {selectedAgreement && (
            <div>
              <label className="label">Against (other party)</label>
              <select {...register('againstUserId')} className="input">
                <option value="">Select…</option>
                <option value={selectedAgreement.landlordId}>Landlord ({selectedAgreement.landlordId.slice(0, 8)}…)</option>
                <option value={selectedAgreement.tenantId}>Tenant ({selectedAgreement.tenantId.slice(0, 8)}…)</option>
              </select>
              {errors.againstUserId && <p className="error">{errors.againstUserId.message}</p>}
            </div>
          )}

          <div>
            <label className="label">Dispute Type</label>
            <select {...register('disputeType')} className="input">
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              {...register('description')}
              rows={5}
              className="input resize-none"
              placeholder="Describe the dispute clearly. Include dates, amounts, and any supporting context. This will be anchored on the blockchain."
            />
            {errors.description && <p className="error">{errors.description.message}</p>}
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-sm text-yellow-800">
          <strong>Note:</strong> Once raised, a dispute cannot be withdrawn. Ensure all details are accurate before submitting.
        </div>

        <button type="submit" disabled={mutation.isPending} className="btn-primary w-full">
          {mutation.isPending ? 'Raising Dispute…' : 'Raise Dispute'}
        </button>
      </form>
    </div>
  );
}
