import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import LibButton from './LibButton';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <LibButton
        variant="ghost"
        size="sm"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </LibButton>
      {Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
        .map((page, idx, arr) => (
          <React.Fragment key={page}>
            {idx > 0 && arr[idx - 1] !== page - 1 && (
              <span className="px-2 text-muted-foreground">…</span>
            )}
            <LibButton
              variant={page === currentPage ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => onPageChange(page)}
            >
              {page}
            </LibButton>
          </React.Fragment>
        ))}
      <LibButton
        variant="ghost"
        size="sm"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <ChevronRight className="h-4 w-4" />
      </LibButton>
    </div>
  );
};

export default Pagination;
