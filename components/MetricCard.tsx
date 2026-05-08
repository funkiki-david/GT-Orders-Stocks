type MetricCardProps = {
  label: string;
  value: string | number;
};

export function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="font-title text-xl font-semibold text-primaryText">{value}</div>
      <div className="mt-1 text-xs text-secondaryText">{label}</div>
    </div>
  );
}
