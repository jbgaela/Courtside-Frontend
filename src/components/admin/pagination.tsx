import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AdminPagination({
  page,
  pages,
  total,
  onChange,
}: {
  page: number;
  pages: number;
  total: number;
  onChange: (page: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <span>
        Page {page} of {pages} · {total} total
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          <ArrowLeft className="size-3.5" /> Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(Math.min(pages, page + 1))}
          disabled={page >= pages}
        >
          Next <ArrowRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
