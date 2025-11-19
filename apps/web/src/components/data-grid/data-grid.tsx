"use client";

import { flexRender } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import * as React from "react";
import { DataGridColumnHeader } from "@/components/data-grid/data-grid-column-header";
import { DataGridContextMenu } from "@/components/data-grid/data-grid-context-menu";
import { DataGridRow } from "@/components/data-grid/data-grid-row";
import { DataGridSearch } from "@/components/data-grid/data-grid-search";
import type { useDataGrid } from "@/hooks/use-data-grid";
import { getCommonPinningStyles } from "@/lib/data-table";
import { cn } from "@/lib/utils";

interface DataGridProps<TData>
  extends ReturnType<typeof useDataGrid<TData>>,
    React.ComponentProps<"div"> {
  height?: number;
}

export function DataGrid<TData>({
  dataGridRef,
  headerRef,
  rowMapRef,
  footerRef,
  table,
  rowVirtualizer,
  height = 600,
  searchState,
  columnSizeVars,
  onRowAdd,
  className,
  ...props
}: DataGridProps<TData>) {
  const rows = table.getRowModel().rows;
  const columns = table.getAllColumns();

  const meta = table.options.meta;
  const rowHeight = meta?.rowHeight ?? "short";
  const focusedCell = meta?.focusedCell ?? null;

  const onGridContextMenu = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault();
    },
    []
  );

  const onAddRowKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!onRowAdd) return;

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onRowAdd();
      }
    },
    [onRowAdd]
  );

  return (
    <div
      className={cn("relative flex w-full flex-col", className)}
      data-slot="grid-wrapper"
      {...props}
    >
      {searchState && <DataGridSearch {...searchState} />}
      <DataGridContextMenu table={table} />
      <div
        aria-colcount={columns.length}
        aria-label="Data grid"
        aria-rowcount={rows.length + (onRowAdd ? 1 : 0)}
        className="relative grid select-none overflow-auto rounded-md border focus:outline-none"
        data-slot="grid"
        onContextMenu={onGridContextMenu}
        ref={dataGridRef}
        role="grid"
        style={{
          ...columnSizeVars,
          maxHeight: `${height}px`,
        }}
        tabIndex={0}
      >
        <div
          className="sticky top-0 z-10 grid border-b bg-background"
          data-slot="grid-header"
          ref={headerRef}
          role="rowgroup"
        >
          {table.getHeaderGroups().map((headerGroup, rowIndex) => (
            <div
              aria-rowindex={rowIndex + 1}
              className="flex w-full"
              data-slot="grid-header-row"
              key={headerGroup.id}
              role="row"
              tabIndex={-1}
            >
              {headerGroup.headers.map((header, colIndex) => {
                const sorting = table.getState().sorting;
                const currentSort = sorting.find(
                  (sort) => sort.id === header.column.id
                );
                const isSortable = header.column.getCanSort();

                return (
                  <div
                    aria-colindex={colIndex + 1}
                    aria-sort={
                      currentSort?.desc === false
                        ? "ascending"
                        : currentSort?.desc === true
                          ? "descending"
                          : isSortable
                            ? "none"
                            : undefined
                    }
                    className={cn("relative", {
                      "border-r": header.column.id !== "select",
                    })}
                    data-slot="grid-header-cell"
                    key={header.id}
                    role="columnheader"
                    style={{
                      ...getCommonPinningStyles({ column: header.column }),
                      width: `calc(var(--header-${header.id}-size) * 1px)`,
                    }}
                    tabIndex={-1}
                  >
                    {header.isPlaceholder ? null : typeof header.column
                        .columnDef.header === "function" ? (
                      <div className="size-full px-3 py-1.5">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </div>
                    ) : (
                      <DataGridColumnHeader header={header} table={table} />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div
          className="relative grid"
          data-slot="grid-body"
          role="rowgroup"
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
          }}
        >
          {rowVirtualizer.getVirtualIndexes().map((virtualRowIndex) => {
            const row = rows[virtualRowIndex];
            if (!row) return null;

            return (
              <DataGridRow
                focusedCell={focusedCell}
                key={row.id}
                row={row}
                rowHeight={rowHeight}
                rowMapRef={rowMapRef}
                rowVirtualizer={rowVirtualizer}
                virtualRowIndex={virtualRowIndex}
              />
            );
          })}
        </div>
        {onRowAdd && (
          <div
            className="sticky bottom-0 z-10 grid border-t bg-background"
            data-slot="grid-footer"
            ref={footerRef}
            role="rowgroup"
          >
            <div
              aria-rowindex={rows.length + 2}
              className="flex w-full"
              data-slot="grid-add-row"
              role="row"
              tabIndex={-1}
            >
              <div
                className="relative flex h-9 grow items-center bg-muted/30 transition-colors hover:bg-muted/50 focus:bg-muted/50 focus:outline-none"
                onClick={onRowAdd}
                onKeyDown={onAddRowKeyDown}
                role="gridcell"
                style={{
                  width: table.getTotalSize(),
                  minWidth: table.getTotalSize(),
                }}
                tabIndex={0}
              >
                <div className="sticky left-0 flex items-center gap-2 px-3 text-muted-foreground">
                  <Plus className="size-3.5" />
                  <span className="text-sm">Add row</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
