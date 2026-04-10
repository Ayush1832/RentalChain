import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import type { Property } from '../../types';

function PropertyCard({ p }: { p: Property }) {
  return (
    <Link to={`/properties/${p.id}`} className="block bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      {p.images?.[0] ? (
        <img src={p.images[0].cloudUrl} alt={p.title} className="w-full h-40 object-cover" />
      ) : (
        <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
          <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          </svg>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{p.title}</h3>
            <p className="text-sm text-gray-500">{p.city}, {p.state}</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            p.listingStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' :
            p.listingStatus === 'RENTED' ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-600'
          }`}>{p.listingStatus}</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-lg font-bold text-gray-900">₹{(p.monthlyRent / 100).toLocaleString('en-IN')}<span className="text-sm font-normal text-gray-400">/mo</span></p>
          <p className="text-xs text-gray-400">{p.propertyType}</p>
        </div>
        {p.bedrooms && (
          <p className="text-xs text-gray-400 mt-1">{p.bedrooms} BHK • {p.areaSqft} sq ft</p>
        )}
      </div>
    </Link>
  );
}

export function PropertiesPage() {
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: () => api.get<{ properties: Property[] }>('/properties').then((r) => r.data.properties),
  });

  const isLandlord = user?.role === 'LANDLORD' || user?.role === 'BOTH';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
        {isLandlord && (
          <Link to="/properties/new" className="btn-primary">
            + List Property
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden animate-pulse">
              <div className="h-40 bg-gray-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : !data?.length ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">No properties found</p>
          {isLandlord && (
            <Link to="/properties/new" className="mt-4 inline-block btn-primary">
              List your first property
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((p) => <PropertyCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}
