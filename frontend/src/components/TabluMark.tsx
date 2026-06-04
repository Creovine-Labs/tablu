/** Tablu logo — used directly on white/light platform surfaces. */
export function TabluLogo({ className = "h-8" }: { className?: string }) {
  return <img src="/brand/tablu-logo.png" alt="Tablu" className={className} />;
}

export function PoweredByTablu() {
  return (
    <div className="flex items-center justify-center gap-1.5 py-3 text-tablu-gray">
      <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Powered by</span>
      <img src="/brand/tablu-icon.jpg" alt="Tablu" className="h-3.5 rounded-[3px]" />
      <span className="text-[11px] font-extrabold text-tablu-black">Tablu</span>
    </div>
  );
}
