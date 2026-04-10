import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import type { Property } from '../../types';

export function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: () => api.get<{ property: Property }>(`/properties/${id}`).then((r) => r.data.property),
    enabled: !!id,
  });

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) => {
      const fd = new FormData();
      files.forEach((f) => fd.append('photos', f));
      return api.post(`/properties/${id}/images`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      toast.success('Images uploaded');
      queryClient.invalidateQueries({ queryKey: ['property', id] });
    },
    onError: () => toast.error('Upload failed'),
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 10,
    onDrop: (files) => uploadMutation.mutate(files),
  });

  if (isLoading) {
    return <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-400">Loading…</div>;
  }
  if (!data) {
    return <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-400">Property not found</div>;
  }

  const isOwner = data.landlordId === user?.id;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{data.title}</h1>
          <p className="text-gray-500 mt-1">{data.addressLine1}, {data.city}, {data.state} - {data.pincode}</p>
        </div>
        <span className={`text-sm px-3 py-1 rounded-full font-medium ${
          data.listingStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' :
          data.listingStatus === 'RENTED' ? 'bg-blue-100 text-blue-700' :
          'bg-gray-100 text-gray-600'
        }`}>{data.listingStatus}</span>
      </div>

      {/* Images */}
      {data.images && data.images.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 mb-6 rounded-xl overflow-hidden">
          {data.images.map((img, i) => (
            <img key={img.id} src={img.cloudUrl} alt={`Photo ${i+1}`} className="w-full h-40 object-cover" />
          ))}
        </div>
      ) : (
        <div className="w-full h-48 bg-gray-100 rounded-xl flex items-center justify-center mb-6">
          <p className="text-gray-400">No photos yet</p>
        </div>
      )}

      {/* Upload section (owner only) */}
      {isOwner && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer mb-6 transition-colors ${
            isDragActive ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <input {...getInputProps()} />
          {uploadMutation.isPending ? (
            <p className="text-sm text-gray-500">Uploading…</p>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-600">Drop photos here or click to upload</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP • Max 10 files</p>
            </>
          )}
        </div>
      )}

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Property Details</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Type</dt>
              <dd className="font-medium">{data.propertyType}</dd>
            </div>
            {data.bedrooms !== undefined && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Bedrooms</dt>
                <dd className="font-medium">{data.bedrooms}</dd>
              </div>
            )}
            {data.bathrooms !== undefined && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Bathrooms</dt>
                <dd className="font-medium">{data.bathrooms}</dd>
              </div>
            )}
            {data.areaSqft && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Area</dt>
                <dd className="font-medium">{data.areaSqft} sq ft</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Pricing</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Monthly Rent</dt>
              <dd className="font-bold text-gray-900 text-lg">₹{(data.monthlyRent / 100).toLocaleString('en-IN')}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Security Deposit</dt>
              <dd className="font-medium">₹{(data.securityDeposit / 100).toLocaleString('en-IN')}</dd>
            </div>
          </dl>
          {data.listingStatus === 'ACTIVE' && !isOwner && (
            <Link to={`/agreements/new?propertyId=${data.id}`} className="btn-primary w-full text-center block mt-4">
              Create Rental Agreement
            </Link>
          )}
        </div>
      </div>

      {data.description && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mt-6">
          <h2 className="font-semibold text-gray-800 mb-2">Description</h2>
          <p className="text-sm text-gray-600 whitespace-pre-line">{data.description}</p>
        </div>
      )}
    </div>
  );
}
