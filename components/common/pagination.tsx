interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (nextPage: number) => void;
}

const buildPageNumbers = (page: number, totalPages: number) => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pageNumbers: number[] = [];
  let start = Math.max(1, page - 2);
  let end = Math.min(totalPages, start + 4);

  if (end - start < 4) {
    start = Math.max(1, end - 4);
    end = Math.min(totalPages, start + 4);
  }

  for (let cursor = start; cursor <= end; cursor += 1) {
    pageNumbers.push(cursor);
  }

  return pageNumbers;
};

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pageNumbers = buildPageNumbers(page, totalPages);

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Sebelumnya
      </button>

      {pageNumbers.map((pageNumber) => (
        <button
          key={pageNumber}
          type="button"
          onClick={() => onPageChange(pageNumber)}
          className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
            pageNumber === page
              ? "border-[var(--primary)] bg-[var(--primary)] text-white"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
          }`}
        >
          {pageNumber}
        </button>
      ))}

      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Berikutnya
      </button>
    </div>
  );
}
