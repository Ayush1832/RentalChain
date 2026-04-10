interface BlockchainBadgeProps {
  txHash: string;
  anchoredAt?: string;
  network?: 'sepolia' | 'mainnet';
  label?: string;
}

export function BlockchainBadge({ txHash, anchoredAt, network = 'sepolia', label }: BlockchainBadgeProps) {
  const shortHash = `${txHash.slice(0, 8)}...${txHash.slice(-6)}`;
  const explorerBase =
    network === 'sepolia'
      ? 'https://sepolia.etherscan.io/tx'
      : 'https://etherscan.io/tx';

  return (
    <div className="chain-badge">
      <span className="text-green-500">&#9679;</span>
      <span>{label ?? 'On-Chain Verified'}</span>
      <span className="text-gray-400">|</span>
      <a
        href={`${explorerBase}/${txHash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono hover:underline"
      >
        TX: {shortHash}
      </a>
      {anchoredAt && (
        <>
          <span className="text-gray-400">|</span>
          <span>{new Date(anchoredAt).toLocaleString('en-IN')}</span>
        </>
      )}
    </div>
  );
}
