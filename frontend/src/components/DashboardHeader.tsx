interface DashboardHeaderProps {
  ledgerSync?: number;
  coldChainStability?: number;
  freshnessScore?: number;
  deviations?: number;
}

export default function DashboardHeader({
  ledgerSync = 99.98,
  coldChainStability = 94,
  freshnessScore = 91,
  deviations = 2,
}: DashboardHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-xl overflow-hidden relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>
      
      <div className="relative px-8 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl lg:text-3xl font-bold text-white">
                UNI-CHAIN Monthly Operational Overview
              </h1>
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30 rounded-lg">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
                <span className="text-sm font-semibold text-emerald-300">LIVE SYSTEM</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4 mt-3">
              <p className="text-lg text-slate-300 font-medium">
                Blockchain-Based Traceability Dashboard
              </p>
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 rounded-lg">
                <svg className="w-4 h-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-sm font-semibold text-blue-300">Ledger Sync: {ledgerSync}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="mt-6 pt-6 border-t border-slate-700/50 flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span className="text-sm font-semibold text-slate-300">
              Cold Chain Stability: <span className="text-white">{coldChainStability}%</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
            <span className="text-sm font-semibold text-slate-300">
              Freshness Score: <span className="text-white">{freshnessScore}/100</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
            <span className="text-sm font-semibold text-slate-300">
              Deviations: <span className="text-white">{deviations}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

