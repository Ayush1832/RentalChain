import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { ReputationScore } from '../../components/ui/ReputationScore';
import type { User, ReputationData } from '../../types';

const schema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email().optional().or(z.literal('')),
  role: z.enum(['TENANT', 'LANDLORD', 'BOTH']),
});
type FormData = z.infer<typeof schema>;

export function ProfilePage() {
  const { updateUser } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<{ user: User }>('/users/me').then((r) => r.data.user),
  });

  const { data: repData } = useQuery({
    queryKey: ['reputation'],
    queryFn: () => api.get<ReputationData>('/users/me/reputation').then((r) => r.data),
  });

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: profileData
      ? { fullName: profileData.fullName ?? '', email: profileData.email ?? '', role: (profileData.role === 'ADMIN' || profileData.role === 'MEDIATOR') ? 'BOTH' : profileData.role as 'TENANT' | 'LANDLORD' | 'BOTH' }
      : undefined,
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.put('/users/me', data),
    onSuccess: (_, vars) => {
      toast.success('Profile updated');
      updateUser({ fullName: vars.fullName, email: vars.email || undefined, role: vars.role as User['role'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
    onError: () => toast.error('Failed to update profile'),
  });

  if (isLoading) {
    return <div className="max-w-2xl mx-auto px-4 py-12 text-center text-gray-400">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* KYC Status */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">KYC Status</p>
          {profileData?.kycStatus === 'VERIFIED' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              ID Verified
            </span>
          ) : profileData?.kycStatus === 'REJECTED' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
              Rejected
            </span>
          ) : profileData?.kycStatus === 'SUBMITTED' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
              Under Review
            </span>
          ) : (
            <a href="/kyc" className="text-sm text-brand-600 font-medium hover:underline">
              Submit KYC Documents →
            </a>
          )}
          {profileData?.didHash && (
            <p className="text-xs text-gray-400 mt-2 font-mono truncate">DID: {profileData.didHash.slice(0, 20)}…</p>
          )}
        </div>

        {/* Reputation */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
          <ReputationScore score={repData?.score ?? 0} />
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Reputation</p>
            <p className="text-2xl font-bold text-gray-900">{repData?.score?.toFixed(1) ?? '—'} / 10</p>
            <p className="text-xs text-gray-400">{repData?.totalTransactions ?? 0} transactions</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        <h2 className="font-semibold text-gray-800">Personal Information</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            value={profileData?.phone ?? ''}
            disabled
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm"
          />
          <p className="text-xs text-gray-400 mt-1">Phone number cannot be changed</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            {...register('fullName')}
            placeholder="Enter your full name"
            className="input"
          />
          {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
          <input
            {...register('email')}
            type="email"
            placeholder="you@example.com"
            className="input"
          />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">I am a</label>
          <select {...register('role')} className="input">
            <option value="TENANT">Tenant</option>
            <option value="LANDLORD">Landlord</option>
            <option value="BOTH">Both Tenant and Landlord</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={!isDirty || mutation.isPending}
          className="btn-primary w-full disabled:opacity-50"
        >
          {mutation.isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
