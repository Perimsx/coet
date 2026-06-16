export default function BackgroundDecoration() {
  return (
    <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden">
      <div className="absolute inset-0 bg-grid bg-grid-mask opacity-70" />
      <div className="absolute top-[-10%] left-[-20%] w-[70vw] h-[70vw] sm:w-[60vw] sm:h-[60vw] bg-blue-500/[0.03] dark:bg-blue-400/[0.05] rounded-full blur-[100px] sm:blur-[120px] bg-glow-blur-1" />
      <div className="absolute bottom-[-10%] right-[-15%] w-[60vw] h-[60vw] sm:w-[50vw] sm:h-[50vw] bg-indigo-500/[0.03] dark:bg-indigo-400/[0.05] rounded-full blur-[100px] sm:blur-[120px] bg-glow-blur-2" />
    </div>
  );
}
