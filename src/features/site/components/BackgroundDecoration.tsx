export default function BackgroundDecoration() {
  return (
    <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden">
      <div className="absolute inset-0 bg-grid bg-grid-mask opacity-45" />
      <div className="cot-page-head-gradient" />
    </div>
  );
}
