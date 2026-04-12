import { Link } from 'react-router-dom';

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Tamper-Proof Agreements',
    desc: 'Every rental agreement is hashed and anchored on Ethereum. No one can alter terms after signing.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Verifiable Payment History',
    desc: 'Every rent payment is recorded on-chain. Landlords and tenants both have cryptographic proof of payment.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: 'IPFS Evidence Storage',
    desc: 'Move-in and move-out photos are stored on IPFS — content-addressed, permanent, and dispute-proof.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    title: 'Portable Rental Identity',
    desc: 'Your verified rental history follows you. No more starting from zero with every new landlord.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
      </svg>
    ),
    title: 'Privacy First (DPDP)',
    desc: 'Your Aadhaar and PAN are encrypted at rest and never go on-chain. Compliant with India\'s DPDP Act.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    title: 'Dispute Resolution',
    desc: 'Evidence bundles are anchored on-chain before disputes. Mediators see what happened, not just allegations.',
  },
];

const steps = [
  { n: '01', title: 'Sign Up & Verify', desc: 'Register with your phone number. Complete KYC to get a Decentralised Identity (DID) anchored on Ethereum.' },
  { n: '02', title: 'List or Find Property', desc: 'Landlords list properties with details and photos. Tenants browse and apply.' },
  { n: '03', title: 'Sign Agreement On-Chain', desc: 'Both parties sign digitally. The agreement hash is anchored on Ethereum within seconds.' },
  { n: '04', title: 'Rent with a Paper Trail', desc: 'Record payments, upload condition photos, raise maintenance tickets — all provably timestamped.' },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-lg font-bold text-brand-700">RentalChain</span>
          <div className="flex items-center gap-4">
            <Link to="/verify" className="text-sm text-gray-500 hover:text-gray-800">Verify Doc</Link>
            <Link to="/login" className="btn-primary text-sm py-1.5 px-4">Get Started</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-medium mb-6 border border-brand-100">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 inline-block"></span>
          Running on Ethereum Sepolia Testnet
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
          Your Rental,<br />
          <span className="text-brand-600">Secured on Blockchain</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10">
          RentalChain anchors agreements, payments, and property evidence on Ethereum —
          creating tamper-proof, portable proof of rental history for landlords and tenants across India.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/login" className="btn-primary px-8 py-3 text-base">
            Get Started Free
          </Link>
          <Link to="/verify" className="btn-secondary px-8 py-3 text-base">
            Verify a Document
          </Link>
        </div>

        {/* Trust badges */}
        <div className="mt-12 flex items-center justify-center gap-8 flex-wrap">
          {[
            { label: 'Ethereum', sub: 'Sepolia Testnet' },
            { label: 'IPFS', sub: 'via Pinata' },
            { label: 'DPDP Compliant', sub: 'Privacy First' },
            { label: 'AES-256', sub: 'Encrypted at Rest' },
          ].map(b => (
            <div key={b.label} className="text-center">
              <p className="text-sm font-semibold text-gray-700">{b.label}</p>
              <p className="text-xs text-gray-400">{b.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900">Everything you need for transparent renting</h2>
            <p className="text-gray-500 mt-3">No more he-said-she-said. Every event is provably timestamped.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(f => (
              <div key={f.title} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-lg flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900">How RentalChain works</h2>
          <p className="text-gray-500 mt-3">Four steps to a fully blockchain-backed rental.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div key={s.n} className="relative">
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-6 left-full w-full h-0.5 bg-brand-100 z-0" style={{ width: 'calc(100% - 24px)', left: 'calc(50% + 12px)' }} />
              )}
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center text-sm mb-4">
                  {s.n}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-600 py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Start building your rental history today</h2>
          <p className="text-brand-200 mb-8">Join landlords and tenants who rent with blockchain-backed confidence.</p>
          <Link to="/login" className="inline-block bg-white text-brand-700 font-semibold px-8 py-3 rounded-lg hover:bg-brand-50 transition-colors">
            Create Your Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400">RentalChain — Blockchain-backed rental trust infrastructure for India</p>
          <div className="flex items-center gap-6">
            <Link to="/verify" className="text-sm text-gray-400 hover:text-gray-600">Verify Document</Link>
            <Link to="/login" className="text-sm text-gray-400 hover:text-gray-600">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
