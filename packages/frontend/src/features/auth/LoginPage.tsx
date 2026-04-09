import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

const phoneSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
});

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must be numeric'),
});

type PhoneForm = z.infer<typeof phoneSchema>;
type OtpForm = z.infer<typeof otpSchema>;

export function LoginPage() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const phoneForm = useForm<PhoneForm>({ resolver: zodResolver(phoneSchema) });
  const otpForm = useForm<OtpForm>({ resolver: zodResolver(otpSchema) });

  async function onSendOtp(data: PhoneForm) {
    setLoading(true);
    try {
      await api.post('/auth/send-otp', { phone: data.phone });
      setPhone(data.phone);
      setStep('otp');
      toast.success('OTP sent to your phone');
    } catch {
      toast.error('Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyOtp(data: OtpForm) {
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { phone, otp: data.otp });
      setAuth(res.data.user, res.data.accessToken);
      navigate('/dashboard');
    } catch {
      toast.error('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-white px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-700">RentalChain</h1>
          <p className="text-gray-500 mt-1 text-sm">Blockchain-secured rentals for India</p>
        </div>

        <div className="card">
          {step === 'phone' ? (
            <form onSubmit={phoneForm.handleSubmit(onSendOtp)} className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold mb-1">Welcome</h2>
                <p className="text-sm text-gray-500">Enter your mobile number to continue</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    +91
                  </span>
                  <input
                    {...phoneForm.register('phone')}
                    placeholder="9876543210"
                    className="input-field rounded-l-none"
                    maxLength={10}
                  />
                </div>
                {phoneForm.formState.errors.phone && (
                  <p className="text-red-500 text-xs mt-1">
                    {phoneForm.formState.errors.phone.message}
                  </p>
                )}
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={otpForm.handleSubmit(onVerifyOtp)} className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold mb-1">Verify OTP</h2>
                <p className="text-sm text-gray-500">
                  Enter the 6-digit OTP sent to +91 {phone}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">OTP</label>
                <input
                  {...otpForm.register('otp')}
                  placeholder="123456"
                  className="input-field text-center text-2xl tracking-widest"
                  maxLength={6}
                />
                {otpForm.formState.errors.otp && (
                  <p className="text-red-500 text-xs mt-1">
                    {otpForm.formState.errors.otp.message}
                  </p>
                )}
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>

              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-full text-sm text-gray-500 hover:text-gray-700"
              >
                Change number
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
