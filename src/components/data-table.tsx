import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  OnChangeFn,
  RowSelectionState,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ITableMeta, TablePagination } from "./table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { useEffect, useState } from "react";
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  meta: ITableMeta;
  rowSelection: RowSelectionState;
  setRowSelection: OnChangeFn<RowSelectionState>;
  onChangePage: (page: number) => void;
  isLoading: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  meta,
  onChangePage,
  rowSelection,
  setRowSelection,
  isLoading,
}: DataTableProps<TData, TValue>) {
  const [tableHeight, setTableHeight] = useState(0);
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
      sorting,
    },
    manualPagination: true,
  });

  useEffect(() => {
    const handleResize = () => {
      const header = document.getElementById("app-header");
      if (!header) return;
      const tableController = document.querySelector(
        ".table-controller"
      ) as HTMLElement | null;
      if (!tableController) return;
      const footer = document.querySelector(
        ".table-footer"
      ) as HTMLElement | null;
      if (!footer) return;
      setTableHeight(
        window.innerHeight -
          header.clientHeight -
          tableController.clientHeight -
          footer.clientHeight -
          40
      );
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return (
    <>
      <div className="rounded-md border border-border">
        <Table tableheight={tableHeight}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  isevenrow={index % 2 === 0}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="table-footer p-2 bg-background rounded-b-md border-t border-border">
          <TablePagination
            meta={meta}
            onChangePage={onChangePage}
            isLoading={isLoading}
          />
        </div>
      </div>
    </>
  );
}
