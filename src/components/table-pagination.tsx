import { motion } from "framer-motion";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./ui/pagination";
import { cn } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";

export interface ITableMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const TablePagination = ({
  meta,
  onChangePage,
  isLoading,
  ...props
}: {
  meta: ITableMeta;
  isLoading: boolean;
  onChangePage: (page: number) => void;
}) => {
  if (isLoading) return <PaginationSkeleton />;

  // Don't render pagination when there are no results
  if (meta.totalPages === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Pagination {...props}>
        <PaginationContent>
          <div className={cn(meta.page === 1 ? "hidden" : "")}>
            <PaginationPrevious onClick={() => onChangePage(meta.page - 1)} />
          </div>

          {meta.page > 3 && (
            <>
              <PaginationItem>
                <PaginationLink onClick={() => onChangePage(1)}>
                  1
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            </>
          )}

          {[-2, -1, 0, 1, 2].map((value, index) => {
            const page = meta.page + value;
            if (page < 1 || page > meta.totalPages) return null;
            return (
              <PaginationItem key={page + index}>
                <PaginationLink
                  onClick={() => onChangePage(page)}
                  isActive={page === meta.page}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            );
          })}

          {meta.totalPages - 3 > meta.page && (
            <>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink onClick={() => onChangePage(meta.totalPages)}>
                  {meta.totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )}

          <div className={cn(meta.page === meta.totalPages ? "hidden" : "")}>
            <PaginationNext onClick={() => onChangePage(meta.page + 1)} />
          </div>
        </PaginationContent>
      </Pagination>
    </motion.div>
  );
};

function PaginationSkeleton() {
  return (
    <Pagination>
      <PaginationContent>
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Skeleton className="h-8 w-2xl" />
        </motion.div>
      </PaginationContent>
    </Pagination>
  );
}
