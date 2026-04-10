import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { BlockchainBadge } from '../../components/blockchain/BlockchainBadge';
import { AnchoringProgress } from '../../components/blockchain/AnchoringProgress';
import type { Agreement, Payment, Evidence, MaintenanceTicket } from '../../types';

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

export function AgreementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showSignForm, setShowSignForm] = useState(false);
  const [anchoringStep, setAnchoringStep] = useState<number | null>(null);

  const { data: agreement, isLoading } = useQuery({
    queryKey: ['agreement', id],
    queryFn: () => api.get<{ agreement: Agreement }>(`/agreements/${id}`).then((r) => r.data.agreement),
    enabled: !!id,
  });

  const { data: payments } = useQuery({
    queryKey: ['payments', id],
    queryFn: () => api.get<{ payments: Payment[] }>(`/agreements/${id}/payments`).then((r) => r.data.payments),
    enabled: !!id,
  });

  const { data: evidence } = useQuery({
    queryKey: ['evidence', id],
    queryFn: () => api.get<{ evidence: Evidence[] }>(`/agreements/${id}/evidence`).then((r) => r.data.evidence),
    enabled: !!id,
  });

  const { data: tickets } = useQuery({
    queryKey: ['maintenance', id],
    queryFn: () => api.get<{ tickets: MaintenanceTicket[] }>(`/agreements/${id}/maintenance`).then((r) => r.data.tickets),
    enabled: !!id,
  });

  const generatePDFMutation = useMutation({
    mutationFn: () => api.post(`/agreements/${id}/generate-pdf`),
    onSuccess: () => {
      toast.success('PDF generated!');
      queryClient.invalidateQueries({ queryKey: ['agreement', id] });
    },
    onError: () => toast.error('Failed to generate PDF'),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<{ otp: string }>();

  const signMutation = useMutation({
    mutationFn: (data: { otp: string }) => {
      setAnchoringStep(0);
      return api.post(`/agreements/${id}/sign`, data);
    },
    onSuccess: (res) => {
      if (res.data.agreement?.blockchainTxHash) {
        setAnchoringStep(3);
      } else if (res.data.blockchainPending) {
        setAnchoringStep(2);
      }
      toast.success(res.data.message ?? 'Signed!');
      queryClient.invalidateQueries({ queryKey: ['agreement', id] });
      setShowSignForm(false);
      reset();
      setTimeout(() => setAnchoringStep(null), 5000);
    },
    onError: (err: any) => {
      setAnchoringStep(null);
      toast.error(err.response?.data?.error?.message ?? 'Failed to sign');
    },
  });

  const terminateMutation = useMutation({
    mutationFn: (reason: string) => api.post(`/agreements/${id}/terminate`, { reason }),
    onSuccess: () => {
      toast.success('Agreement terminated');
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      navigate('/agreements');
    },
    onError: () => toast.error('Failed to terminate'),
  });

  if (isLoading) return <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-400">Loading…</div>;
  if (!agreement) return <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-400">Not found</div>;

  const isLandlord = agreement.landlordId === user?.id;
  const isTenant = agreement.tenantId === user?.id;
  const mySignedAt = isLandlord ? agreement.landlordSignedAt : agreement.tenantSignedAt;
  const canSign = (isLandlord || isTenant) && !mySignedAt && agreement.pdfIpfsCid;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rental Agreement</h1>
          <p className="text-xs font-mono text-gray-400 mt-1">{agreement.id}</p>
        </div>
        <span className={`text-sm px-3 py-1 rounded-full font-medium ${
          agreement.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
          agreement.status === 'PENDING_SIGNATURES' ? 'bg-yellow-100 text-yellow-700' :
          agreement.status === 'TERMINATED' ? 'bg-red-100 text-red-700' :
          'bg-gray-100 text-gray-600'
        }`}>{agreement.status.replace('_', ' ')}</span>
      </div>

      {/* Blockchain status */}
      {anchoringStep !== null && (
        <div className="mb-6">
          <AnchoringProgress currentStep={anchoringStep} />
        </div>
      )}
      {agreement.blockchainTxHash && (
        <div className="mb-6">
          <BlockchainBadge txHash={agreement.blockchainTxHash} label="Agreement Anchored" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Terms */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-800 mb-3">Agreement Terms</h2>
          <InfoRow label="Monthly Rent" value={`₹${(agreement.monthlyRent / 100).toLocaleString('en-IN')}`} />
          <InfoRow label="Security Deposit" value={`₹${(agreement.securityDeposit / 100).toLocaleString('en-IN')}`} />
          <InfoRow label="Start Date" value={new Date(agreement.startDate).toLocaleDateString('en-IN')} />
          {agreement.endDate && <InfoRow label="End Date" value={new Date(agreement.endDate).toLocaleDateString('en-IN')} />}
          <InfoRow label="Notice Period" value={`${agreement.noticePeriodDays} days`} />
          <InfoRow label="Rent Due" value={`${agreement.rentDueDay}th of month`} />
        </div>

        {/* Signatures */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-800 mb-3">Signatures</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Landlord</span>
              {agreement.landlordSignedAt ? (
                <span className="text-xs text-green-600 font-medium">
                  ✓ Signed {new Date(agreement.landlordSignedAt).toLocaleDateString('en-IN')}
                </span>
              ) : (
                <span className="text-xs text-gray-400">Pending</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Tenant</span>
              {agreement.tenantSignedAt ? (
                <span className="text-xs text-green-600 font-medium">
                  ✓ Signed {new Date(agreement.tenantSignedAt).toLocaleDateString('en-IN')}
                </span>
              ) : (
                <span className="text-xs text-gray-400">Pending</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        {isLandlord && agreement.status === 'DRAFT' && !agreement.pdfIpfsCid && (
          <button
            onClick={() => generatePDFMutation.mutate()}
            disabled={generatePDFMutation.isPending}
            className="btn-primary"
          >
            {generatePDFMutation.isPending ? 'Generating…' : 'Generate PDF'}
          </button>
        )}

        {agreement.pdfCloudUrl && (
          <a href={agreement.pdfCloudUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary">
            View PDF
          </a>
        )}

        {canSign && (
          <button onClick={() => setShowSignForm(!showSignForm)} className="btn-primary">
            Sign Agreement
          </button>
        )}

        {agreement.status === 'ACTIVE' && (isLandlord || isTenant) && (
          <>
            <Link to={`/agreements/${id}/payments/new`} className="btn-secondary">
              Record Payment
            </Link>
            <Link to={`/agreements/${id}/evidence/upload`} className="btn-secondary">
              Upload Evidence
            </Link>
            <Link to={`/disputes/new?agreementId=${id}`} className="btn-secondary text-red-600 border-red-200 hover:bg-red-50">
              Raise Dispute
            </Link>
          </>
        )}

        {agreement.status === 'ACTIVE' && (isLandlord || isTenant) && (
          <button
            onClick={() => {
              const reason = window.prompt('Reason for termination?');
              if (reason && reason.length >= 5) terminateMutation.mutate(reason);
            }}
            className="btn-secondary text-red-600 border-red-200 hover:bg-red-50"
          >
            Terminate
          </button>
        )}
      </div>

      {/* Sign Form */}
      {showSignForm && (
        <div className="bg-white border border-brand-200 rounded-xl p-5 mb-6">
          <h3 className="font-semibold text-gray-800 mb-1">Sign with OTP</h3>
          <p className="text-xs text-gray-500 mb-4">An OTP will be sent to your registered mobile. Enter it below to sign.</p>
          <form onSubmit={handleSubmit((d) => signMutation.mutate(d))} className="flex gap-3">
            <input
              {...register('otp', { required: 'Enter the 6-digit OTP' })}
              placeholder="123456"
              maxLength={6}
              className="input font-mono w-36"
            />
            <button type="submit" disabled={signMutation.isPending} className="btn-primary">
              {signMutation.isPending ? 'Signing…' : 'Confirm Sign'}
            </button>
          </form>
          {errors.otp && <p className="error mt-1">{errors.otp.message}</p>}
        </div>
      )}

      {/* Payments list */}
      {payments && payments.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Payments</h2>
            <Link to={`/agreements/${id}/payments/new`} className="text-xs text-brand-600 hover:underline">+ Record</Link>
          </div>
          {payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-5 py-3 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-900">₹{(p.amount / 100).toLocaleString('en-IN')}</p>
                <p className="text-xs text-gray-400">{p.paymentMonth} · {p.paymentMethod}</p>
              </div>
              <div className="text-right">
                {p.blockchainTxHash ? (
                  <span className="text-xs text-green-600 font-medium">⛓ Anchored</span>
                ) : (
                  <span className="text-xs text-gray-400">Pending</span>
                )}
                {p.confirmedAt && <p className="text-xs text-gray-400">Confirmed</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Evidence list */}
      {evidence && evidence.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Evidence</h2>
            <Link to={`/agreements/${id}/evidence/upload`} className="text-xs text-brand-600 hover:underline">+ Upload</Link>
          </div>
          {evidence.map((ev) => (
            <div key={ev.id} className="flex items-center justify-between px-5 py-3 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-900">{ev.evidenceType.replace('_', ' ')}</p>
                <p className="text-xs text-gray-400">{ev.cloudUrls.length} photo(s) · {new Date(ev.createdAt).toLocaleDateString('en-IN')}</p>
              </div>
              {ev.blockchainTxHash && <span className="text-xs text-green-600 font-medium">⛓ Anchored</span>}
            </div>
          ))}
        </div>
      )}

      {/* Maintenance list */}
      {tickets && tickets.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Maintenance</h2>
          </div>
          {tickets.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-5 py-3 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-900">{t.title}</p>
                <p className="text-xs text-gray-400">{t.priority} · {t.category}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                t.status === 'RESOLVED' || t.status === 'CLOSED' ? 'bg-green-100 text-green-700' :
                t.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-600'
              }`}>{t.status.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
