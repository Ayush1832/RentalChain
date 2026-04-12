import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

type Role = 'TENANT' | 'LANDLORD' | 'BOTH';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Name too short').max(100),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  role: z.enum(['TENANT', 'LANDLORD', 'BOTH']),
});
type ProfileData = z.infer<typeof profileSchema>;

const kycSchema = z.object({
  fullName: z.string().min(2),
  dateOfBirth: z.string().optional(),
  aadhaarNumber: z.string().regex(/^\d{12}$/, 'Must be exactly 12 digits'),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'Invalid PAN format (e.g. ABCDE1234F)'),
  address: z.string().min(10, 'Full address required').max(500),
});
type KYCData = z.infer<typeof kycSchema>;

const STEPS = ['Role', 'Profile', 'KYC', 'Done'] as const;

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const [step, setStep] = useState(0);

  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: user?.fullName ?? '', email: user?.email ?? '', role: (user?.role as Role) ?? 'TENANT' },
  });

  const kycForm = useForm<KYCData>({
    resolver: zodResolver(kycSchema),
    defaultValues: { fullName: user?.fullName ?? '' },
  });

  const [selectedRole, setSelectedRole] = useState<Role>((user?.role as Role) ?? 'TENANT');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleProfileSubmit(data: ProfileData) {
    setIsSubmitting(true);
    try {
      await api.put('/users/me', {
        fullName: data.fullName,
        email: data.email || undefined,
        role: data.role,
      });
      updateUser({ fullName: data.fullName, email: data.email || undefined, role: data.role });
      setStep(2);
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleKYCSubmit(data: KYCData) {
    setIsSubmitting(true);
    try {
      await api.post('/users/kyc', data);
      toast.success('KYC submitted — awaiting admin review');
      setStep(3);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? 'KYC submission failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-brand-700">RentalChain</h1>
        <p className="text-sm text-gray-500 mt-1">Let's get you set up</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold
              ${i < step ? 'bg-brand-600 text-white' : i === step ? 'bg-brand-600 text-white ring-2 ring-brand-200' : 'bg-gray-200 text-gray-500'}`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-xs font-medium ${i === step ? 'text-brand-700' : 'text-gray-400'}`}>{label}</span>
            {i < STEPS.length - 1 && <div className="w-8 h-0.5 bg-gray-200" />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm w-full max-w-md p-8">

        {/* Step 0: Role selection */}
        {step === 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">How will you use RentalChain?</h2>
            <p className="text-sm text-gray-500 mb-6">You can change this later in your profile.</p>
            <div className="space-y-3">
              {([
                { value: 'TENANT', title: 'Tenant', desc: 'I rent properties and want a portable rental history.' },
                { value: 'LANDLORD', title: 'Landlord', desc: 'I own or manage properties and want tamper-proof agreements.' },
                { value: 'BOTH', title: 'Both', desc: 'I rent and also own properties.' },
              ] as { value: Role; title: string; desc: string }[]).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedRole(opt.value)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                    selectedRole === opt.value ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-semibold text-gray-900">{opt.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                profileForm.setValue('role', selectedRole);
                setStep(1);
              }}
              className="btn-primary w-full mt-6"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 1: Profile */}
        {step === 1 && (
          <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Your profile</h2>
            <div>
              <label className="label">Full Name</label>
              <input {...profileForm.register('fullName')} className="input" placeholder="Priya Sharma" />
              {profileForm.formState.errors.fullName && (
                <p className="error">{profileForm.formState.errors.fullName.message}</p>
              )}
            </div>
            <div>
              <label className="label">Email (optional)</label>
              <input {...profileForm.register('email')} type="email" className="input" placeholder="priya@example.com" />
            </div>
            <input type="hidden" {...profileForm.register('role')} />
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
              {isSubmitting ? 'Saving…' : 'Save & Continue'}
            </button>
            <button type="button" onClick={() => setStep(0)} className="btn-secondary w-full text-sm">
              Back
            </button>
          </form>
        )}

        {/* Step 2: KYC */}
        {step === 2 && (
          <form onSubmit={kycForm.handleSubmit(handleKYCSubmit)} className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Identity Verification (KYC)</h2>
              <p className="text-xs text-gray-500 mb-4">
                Your Aadhaar and PAN are AES-256 encrypted and never stored on-chain. Required to create agreements and sign documents.
              </p>
            </div>
            <div>
              <label className="label">Full Name (as on documents)</label>
              <input {...kycForm.register('fullName')} className="input" placeholder="Priya Sharma" />
              {kycForm.formState.errors.fullName && <p className="error">{kycForm.formState.errors.fullName.message}</p>}
            </div>
            <div>
              <label className="label">Date of Birth</label>
              <input {...kycForm.register('dateOfBirth')} type="date" className="input" />
            </div>
            <div>
              <label className="label">Aadhaar Number</label>
              <input {...kycForm.register('aadhaarNumber')} className="input font-mono" placeholder="XXXX XXXX XXXX" maxLength={12} />
              {kycForm.formState.errors.aadhaarNumber && <p className="error">{kycForm.formState.errors.aadhaarNumber.message}</p>}
            </div>
            <div>
              <label className="label">PAN Number</label>
              <input {...kycForm.register('panNumber')} className="input font-mono uppercase" placeholder="ABCDE1234F" maxLength={10} />
              {kycForm.formState.errors.panNumber && <p className="error">{kycForm.formState.errors.panNumber.message}</p>}
            </div>
            <div>
              <label className="label">Full Address</label>
              <textarea {...kycForm.register('address')} rows={3} className="input resize-none" placeholder="House/Flat No., Street, City, State, PIN" />
              {kycForm.formState.errors.address && <p className="error">{kycForm.formState.errors.address.message}</p>}
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
              {isSubmitting ? 'Submitting…' : 'Submit KYC'}
            </button>
            <button type="button" onClick={() => setStep(3)} className="w-full text-sm text-gray-400 hover:text-gray-600 py-1">
              Skip for now
            </button>
          </form>
        )}

        {/* Step 3: Done */}
        {step === 3 && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">You're all set!</h2>
            <p className="text-sm text-gray-500 mb-6">
              Your account is ready. Once KYC is approved, you'll get a DID anchored on Ethereum.
            </p>
            <button onClick={() => navigate('/dashboard')} className="btn-primary w-full">
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
