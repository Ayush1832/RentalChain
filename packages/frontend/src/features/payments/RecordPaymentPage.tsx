import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { AnchoringProgress } from '../../components/blockchain/AnchoringProgress';
import type { Agreement } from '../../types';

const schema = z.object({
  amount: z.number().int().min(1, 'Enter amount in ₹'),
  paymentMethod: z.enum(['UPI', 'BANK_TRANSFER', 'CASH', 'CHEQUE']),
  paymentMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Use YYYY-MM format'),
  upiTransactionId: z.string().optional(),
  notes: z.string().max(500).optional(),
});
type FormData = z.infer<typeof schema>;

export function RecordPaymentPage() {
  const { id: agreementId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [anchoringStep, setAnchoringStep] = useState<number | null>(null);

  const { data: agreement } = useQuery({
    queryKey: ['agreement', agreementId],
    queryFn: () => api.get<{ agreement: Agreement }>(`/agreements/${agreementId}`).then(r => r.data.agreement),
    enabled: !!agreementId,
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': ['.jpg', '.jpeg', '.png'], 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    onDrop: (files) => setReceiptFile(files[0] ?? null),
  });

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      paymentMethod: 'UPI',
      paymentMonth: new Date().toISOString().slice(0, 7),
    },
  });

  const paymentMethod = watch('paymentMethod');

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      setAnchoringStep(0);
      const fd = new FormData();
      fd.append('amount', String(Math.round(data.amount * 100)));
      fd.append('paymentMethod', data.paymentMethod);
      fd.append('paymentMonth', data.paymentMonth);
      if (data.upiTransactionId) fd.append('upiTransactionId', data.upiTransactionId);
      if (data.notes) fd.append('notes', data.notes);
      if (receiptFile) fd.append('receipt', receiptFile);
      setAnchoringStep(1);
      const res = await api.post(`/agreements/${agreementId}/payments`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAnchoringStep(2);
      return res;
    },
    onSuccess: () => {
      setAnchoringStep(3);
      toast.success('Payment recorded and anchoring on blockchain…');
      queryClient.invalidateQueries({ queryKey: ['payments', agreementId] });
      setTimeout(() => {
        navigate(`/agreements/${agreementId}`);
      }, 1500);
    },
    onError: (err: any) => {
      setAnchoringStep(null);
      toast.error(err.response?.data?.error?.message ?? 'Failed to record payment');
    },
  });

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Record Rent Payment</h1>
        {agreement && (
          <p className="text-sm text-gray-500 mt-1">
            Agreement · ₹{(agreement.monthlyRent / 100).toLocaleString('en-IN')}/month
          </p>
        )}
      </div>

      {anchoringStep !== null && (
        <div className="mb-6">
          <AnchoringProgress currentStep={anchoringStep} />
        </div>
      )}

      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-5">
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Amount (₹)</label>
              <input
                {...register('amount', { valueAsNumber: true })}
                type="number"
                min="1"
                placeholder={agreement ? String(agreement.monthlyRent / 100) : ''}
                className="input"
              />
              {errors.amount && <p className="error">{errors.amount.message}</p>}
            </div>
            <div>
              <label className="label">Payment Month</label>
              <input {...register('paymentMonth')} type="month" className="input" />
              {errors.paymentMonth && <p className="error">{errors.paymentMonth.message}</p>}
            </div>
          </div>

          <div>
            <label className="label">Payment Method</label>
            <select {...register('paymentMethod')} className="input">
              <option value="UPI">UPI</option>
              <option value="BANK_TRANSFER">Bank Transfer (NEFT/IMPS)</option>
              <option value="CASH">Cash</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </div>

          {paymentMethod === 'UPI' && (
            <div>
              <label className="label">UPI Transaction ID</label>
              <input
                {...register('upiTransactionId')}
                placeholder="e.g. 407890123456"
                className="input font-mono"
              />
            </div>
          )}

          <div>
            <label className="label">Notes (optional)</label>
            <textarea {...register('notes')} rows={2} className="input resize-none" placeholder="Month of April, includes maintenance…" />
          </div>
        </div>

        {/* Receipt Upload */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <label className="label">Receipt / Screenshot (optional)</label>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input {...getInputProps()} />
            {receiptFile ? (
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm font-medium text-gray-700">{receiptFile.name}</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setReceiptFile(null); }}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-600">Drop receipt here or click to browse</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, PDF · Max 10 MB</p>
              </>
            )}
          </div>
        </div>

        <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 text-sm text-brand-800">
          A SHA-256 hash of this payment will be anchored on Ethereum Sepolia as immutable proof.
        </div>

        <button type="submit" disabled={mutation.isPending} className="btn-primary w-full">
          {mutation.isPending ? 'Recording…' : 'Record Payment'}
        </button>
      </form>
    </div>
  );
}
