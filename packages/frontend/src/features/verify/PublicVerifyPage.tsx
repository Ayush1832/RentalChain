import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

function fetchVerification(txHashOrId: string) {
  // Try agreement first, fall back to tx-hash lookup
  if (txHashOrId.startsWith('0x') && txHashOrId.length === 66) {
    // bytes32 on-chain agreement ID
    return axios.get(`/api/v1/verify/agreement/${txHashOrId}`).then((r) => r.data);
  }
  // TX hash — try payment then evidence
  return axios.get(`/api/v1/verify/payment/${txHashOrId}`)
    .then((r) => r.data)
    .catch(() => axios.get(`/api/v1/verify/evidence/${txHashOrId}`).then((r) => r.data));
}

export function PublicVerifyPage() {
  const { txHash } = useParams<{ txHash?: string }>();
  const navigate = useNavigate();
  const [input, setInput] = useState(txHash ?? '');
  const [query, setQuery] = useState(txHash ?? '');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['verify', query],
    queryFn: () => fetchVerification(query),
    enabled: !!query,
    retry: false,
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (input) {
      setQuery(input);
      navigate(`/verify/${input}`, { replace: true });
    }
  }

  const explorerUrl = query
    ? `https://sepolia.etherscan.io/tx/${query}`
    : null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center px-4 pt-16">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Verify Rental Record</h1>
          <p className="text-sm text-gray-500 mt-1">
            Enter a transaction hash or on-chain ID to independently verify a rental event on Ethereum.
          </p>
        </div>

        {/* Input */}
        <form onSubmit={onSubmit} className="card flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="0x... (transaction hash or on-chain agreement ID)"
            className="input-field font-mono text-sm flex-1"
          />
          <button type="submit" className="btn-primary whitespace-nowrap">
            Verify
          </button>
        </form>

        {/* Result */}
        {isLoading && (
          <div className="card text-center py-8 text-sm text-gray-500">
            Querying blockchain...
          </div>
        )}

        {isError && (
          <div className="card border-red-200 bg-red-50">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✗</span>
              <div>
                <p className="font-semibold text-red-700">Record Not Found</p>
                <p className="text-sm text-red-600 mt-0.5">
                  No rental event found for this hash. It may not be anchored on RentalChain.
                </p>
              </div>
            </div>
          </div>
        )}

        {data && (
          <div className="card border-green-200 bg-green-50 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✓</span>
              <div>
                <p className="font-semibold text-green-700">Verified on Ethereum Sepolia</p>
                <p className="text-xs text-green-600 mt-0.5">
                  This record was anchored on the blockchain and cannot be altered.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 space-y-3 text-sm">
              <Row label="Event Type" value={data.eventType} />
              <Row label="Anchored At" value={data.anchoredAt ? new Date(data.anchoredAt).toLocaleString('en-IN') : '—'} />
              {data.landlordDID && <Row label="Landlord DID" value={data.landlordDID} mono />}
              {data.tenantDID && <Row label="Tenant DID" value={data.tenantDID} mono />}
              {data.agreementHash && <Row label="Agreement Hash" value={data.agreementHash} mono />}
              {data.paymentHash && <Row label="Payment Hash" value={data.paymentHash} mono />}
              {data.evidenceHash && <Row label="Evidence Hash" value={data.evidenceHash} mono />}
              <Row label="Transaction" value={query} mono />
            </div>

            {explorerUrl && (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:underline"
              >
                View on Sepolia Etherscan →
              </a>
            )}
          </div>
        )}

        <p className="text-center text-xs text-gray-400">
          RentalChain anchors rental events on Ethereum. No personal data is stored on-chain.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className={`text-gray-900 text-right break-all ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}
