export default function PageLoader() {
  return (
    <div className="fixed inset-0 z-[9999] bg-gray-900 flex flex-col items-center justify-center">

      {/* Animated icon */}
      <div className="animate-pulse">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="270 30 140 140" width="72" height="72">
          <rect x="270" y="30" width="140" height="140" rx="24" fill="#111827" stroke="#374151" strokeWidth="1"/>
          <rect x="292" y="56" width="96" height="100" rx="5" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M302 56 Q340 36 388 56" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="340" y1="56" x2="340" y2="156" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.35"/>
          <circle cx="374" cy="108" r="6" fill="#ffffff"/>
        </svg>
      </div>

      {/* Wordmark */}
      <div className="mt-6 text-center">
        <p className="text-white font-bold text-2xl tracking-tight">Dowels</p>
        <p className="text-gray-500 text-xs mt-1">by Dorcas Owela</p>
      </div>

      {/* Loading bar */}
      <div className="mt-8 w-32 h-0.5 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full bg-white rounded-full animate-[loading_1.5s_ease-in-out_infinite]" />
      </div>
    </div>
  );
}