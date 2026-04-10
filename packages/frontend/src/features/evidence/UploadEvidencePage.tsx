import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { AnchoringProgress } from '../../components/blockchain/AnchoringProgress';
import { BlockchainBadge } from '../../components/blockchain/BlockchainBadge';
import type { Evidence } from '../../types';

const schema = z.object({
  evidenceType: z.enum(['MOVE_IN', 'MOVE_OUT', 'MAINTENANCE', 'INSPECTION']),
  description: z.string().min(5, 'Describe what the photos show').max(500),
});
type FormData = z.infer<typeof schema>;

const TYPE_LABELS: Record<string, string> = {
  MOVE_IN: 'Move-In Inspection',
  MOVE_OUT: 'Move-Out Inspection',
  MAINTENANCE: 'Maintenance Record',
  INSPECTION: 'Periodic Inspection',
};

export function UploadEvidencePage() {
  const { id: agreementId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);
  const [anchoringStep, setAnchoringStep] = useState<number | null>(null);

  const { data: existingEvidence } = useQuery({
    queryKey: ['evidence', agreementId],
    queryFn: () => api.get<{ evidence: Evidence[] }>(`/agreements/${agreementId}/evidence`).then(r => r.data.evidence),
    enabled: !!agreementId,
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 20,
    onDrop: (dropped) => setFiles(prev => [...prev, ...dropped].slice(0, 20)),
  });

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { evidenceType: 'MOVE_IN' },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!files.length) throw new Error('Add at least one photo');
      setAnchoringStep(0);
      const fd = new FormData();
      fd.append('evidenceType', data.evidenceType);
      fd.append('description', data.description);
      files.forEach(f => fd.append('photos', f));
      setAnchoringStep(1);
      const res = await api.post(`/agreements/${agreementId}/evidence`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAnchoringStep(2);
      return res;
    },
    onSuccess: () => {
      setAnchoringStep(3);
      toast.success('Evidence uploaded and anchoring on blockchain…');
      queryClient.invalidateQueries({ queryKey: ['evidence', agreementId] });
      setTimeout(() => navigate(`/agreements/${agreementId}`), 1500);
    },
    onError: (err: any) => {
      setAnchoringStep(null);
      toast.error(err.message ?? err.response?.data?.error?.message ?? 'Upload failed');
    },
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to={`/agreements/${agreementId}`} className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-2xl font-bold text-gray-900">Upload Evidence</h1>
      </div>

      {anchoringStep !== null && (
        <div className="mb-6">
          <AnchoringProgress currentStep={anchoringStep} />
        </div>
      )}

      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-5">
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <div>
            <label className="label">Evidence Type</label>
            <select {...register('evidenceType')} className="input">
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              className="input resize-none"
              placeholder="Describe the condition, damage, or situation shown in the photos…"
            />
            {errors.description && <p className="error">{errors.description.message}</p>}
          </div>
        </div>

        {/* Photo drop zone */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <label className="label">Photos ({files.length}/20)</label>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input {...getInputProps()} />
            <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm font-medium text-gray-600">Drop photos or click to browse</p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP · Max 20 photos · 10 MB each</p>
          </div>

          {files.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mt-4">
              {files.map((f, i) => (
                <div key={i} className="relative group">
                  <img
                    src={URL.createObjectURL(f)}
                    alt={`Preview ${i + 1}`}
                    className="w-full h-20 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 text-sm text-brand-800">
          All photos are bundled and pinned to IPFS. A SHA-256 hash of the bundle is anchored on Ethereum as tamper-proof evidence.
        </div>

        <button type="submit" disabled={mutation.isPending || !files.length} className="btn-primary w-full disabled:opacity-50">
          {mutation.isPending ? 'Uploading…' : `Upload ${files.length} Photo${files.length !== 1 ? 's' : ''}`}
        </button>
      </form>

      {/* Existing evidence */}
      {existingEvidence && existingEvidence.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Previous Evidence Records</h2>
          <div className="space-y-4">
            {existingEvidence.map(ev => (
              <div key={ev.id} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{TYPE_LABELS[ev.evidenceType]}</p>
                    <p className="text-xs text-gray-400">{new Date(ev.createdAt).toLocaleDateString('en-IN')} · {ev.cloudUrls.length} photo(s)</p>
                  </div>
                  {ev.blockchainTxHash && <BlockchainBadge txHash={ev.blockchainTxHash} label="Anchored" />}
                </div>
                {ev.description && <p className="text-sm text-gray-600 mb-3">{ev.description}</p>}
                {ev.cloudUrls.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {ev.cloudUrls.slice(0, 8).map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt={`Evidence ${i + 1}`} className="w-full h-16 object-cover rounded-lg hover:opacity-80 transition-opacity" />
                      </a>
                    ))}
                    {ev.cloudUrls.length > 8 && (
                      <div className="w-full h-16 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-500">
                        +{ev.cloudUrls.length - 8} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
