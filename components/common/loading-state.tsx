interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label = "Loading data..." }: LoadingStateProps) {
  return (
    <div className="card-surface flex min-h-48 items-center justify-center p-8">
      <div className="flex items-center gap-3 text-slate-600">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-[var(--primary)]" />
        <p className="text-sm font-medium">{label}</p>
      </div>
    </div>
  );
}
