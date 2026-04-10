interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="card-surface border-red-200 p-6">
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-red-700">Terjadi kesalahan</p>
        <p className="text-sm text-red-600">{message}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="w-fit rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
          >
            Coba lagi
          </button>
        ) : null}
      </div>
    </div>
  );
}
