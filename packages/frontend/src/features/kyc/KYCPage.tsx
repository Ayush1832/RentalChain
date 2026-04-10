import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import type { User } from '../../types';

const schema = z.object({
  aadhaarNumber: z.string().regex(/^\d{12}$/, 'Must be 12 digits'),
  panNumber: z.string().regex(/^[A-Z]{5}\d{4}[A-Z]$/, 'Invalid PAN format (e.g. ABCDE1234F)'),
  fullName: z.string().min(2).max(100),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
  address: z.string().min(10).max(500),
});
type FormData = z.infer<typeof schema>;

export function KYCPage() {
  const { updateUser } = useAuthStore();
  const navigate = useNavigate();

  const { data: profileData } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<{ user: User }>('/users/me').then((r) => r.data.user),
  });

  const { data: kycRecord } = useQuery({
    queryKey: ['kyc'],
    queryFn: () => api.get('/users/me/kyc').then((r) => r.data).catch(() => null),
  });

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/users/me/kyc', data),
    onSuccess: () => {
      toast.success('KYC submitted! Our team will review within 24 hours.');
      updateUser({ kycStatus: 'SUBMITTED' });
      navigate('/profile');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message ?? 'Submission failed');
    },
  });

  if (profileData?.kycStatus === 'VERIFIED') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">KYC Verified</h1>
        <p className="text-gray-500">Your identity has been verified. Your decentralized ID is active.</p>
        {profileData.didHash && (
          <p className="mt-4 text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-500 break-all">
            DID: {profileData.didHash}
          </p>
        )}
      </div>
    );
  }

  if (profileData?.kycStatus === 'SUBMITTED' || kycRecord) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Under Review</h1>
        <p className="text-gray-500">Your KYC documents are being reviewed. This usually takes 24 hours.</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Identity Verification (KYC)</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Your details are encrypted and stored securely. Only verification hashes are recorded on-chain — no PII.
        </p>
      </div>

      <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 mb-6 text-sm text-brand-800">
        <strong>Privacy note:</strong> Your Aadhaar and PAN are encrypted with AES-256. Admins see only masked values during review. Nothing personally identifiable is ever written to the blockchain.
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name (as per Aadhaar)</label>
          <input {...register('fullName')} placeholder="Rahul Sharma" className="input" />
          {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
          <input {...register('dateOfBirth')} type="date" className="input" />
          {errors.dateOfBirth && <p className="text-xs text-red-500 mt-1">{errors.dateOfBirth.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar Number</label>
          <input
            {...register('aadhaarNumber')}
            placeholder="1234 5678 9012"
            maxLength={12}
            className="input font-mono"
          />
          {errors.aadhaarNumber && <p className="text-xs text-red-500 mt-1">{errors.aadhaarNumber.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
          <input
            {...register('panNumber')}
            placeholder="ABCDE1234F"
            maxLength={10}
            className="input font-mono uppercase"
            style={{ textTransform: 'uppercase' }}
          />
          {errors.panNumber && <p className="text-xs text-red-500 mt-1">{errors.panNumber.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <textarea
            {...register('address')}
            placeholder="Flat 4B, Sunrise Apartments, MG Road, Bengaluru - 560001"
            rows={3}
            className="input resize-none"
          />
          {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>}
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="btn-primary w-full"
        >
          {mutation.isPending ? 'Submitting…' : 'Submit for Verification'}
        </button>
      </form>
    </div>
  );
}
