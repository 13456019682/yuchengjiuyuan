// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Pagination as ShadcnPagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui';

export default function PaginationControl({
  currentPage,
  totalPages,
  onPageChange
}) {
  // 生成页码数组
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5; // 最多显示5个页码

    if (totalPages <= maxVisiblePages) {
      // 总页数少于最大显示数，显示全部
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 总页数较多，需要省略显示
      if (currentPage <= 3) {
        // 当前页在前部
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // 当前页在后部
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // 当前页在中部
        pages.push(1);
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }
    return pages;
  };
  return <ShadcnPagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious onClick={() => onPageChange(Math.max(1, currentPage - 1))} className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
        </PaginationItem>
        
        {getPageNumbers().map((page, index) => <PaginationItem key={index}>
            {page === 'ellipsis' ? <PaginationEllipsis /> : <PaginationLink onClick={() => onPageChange(page)} isActive={currentPage === page} className="cursor-pointer">
                {page}
              </PaginationLink>}
          </PaginationItem>)}
        
        <PaginationItem>
          <PaginationNext onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
        </PaginationItem>
      </PaginationContent>
    </ShadcnPagination>;
}