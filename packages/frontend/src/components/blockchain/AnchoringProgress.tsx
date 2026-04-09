type Step = 'hash' | 'ipfs' | 'chain' | 'done';

interface AnchoringProgressProps {
  currentStep: Step;
  txHash?: string;
}

const STEPS: { key: Step; label: string }[] = [
  { key: 'hash', label: 'Generating hash' },
  { key: 'ipfs', label: 'Uploading to IPFS' },
  { key: 'chain', label: 'Anchoring on Ethereum Sepolia' },
  { key: 'done', label: 'Complete' },
];

const ORDER: Step[] = ['hash', 'ipfs', 'chain', 'done'];

export function AnchoringProgress({ currentStep, txHash }: AnchoringProgressProps) {
  const currentIdx = ORDER.indexOf(currentStep);

  return (
    <div className="space-y-2">
      {STEPS.map((step, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        return (
          <div key={step.key} className="flex items-center gap-3 text-sm">
            <span className={`w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold shrink-0 ${
              done ? 'bg-green-500 text-white' :
              active ? 'bg-brand-600 text-white animate-pulse' :
              'bg-gray-200 text-gray-400'
            }`}>
              {done ? '✓' : idx + 1}
            </span>
            <span className={done ? 'text-gray-500 line-through' : active ? 'text-gray-900 font-medium' : 'text-gray-400'}>
              {step.label}
            </span>
            {step.key === 'done' && done && txHash && (
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 hover:underline text-xs ml-auto"
              >
                View on Etherscan →
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}
