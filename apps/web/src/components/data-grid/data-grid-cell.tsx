"use client";

import type { Cell, Table } from "@tanstack/react-table";

import {
  CheckboxCell,
  DateCell,
  FileCell,
  LongTextCell,
  MultiSelectCell,
  NumberCell,
  SelectCell,
  ShortTextCell,
  UrlCell,
} from "@/components/data-grid/data-grid-cell-variants";

interface DataGridCellProps<TData> {
  cell: Cell<TData, unknown>;
  table: Table<TData>;
}

export function DataGridCell<TData>({ cell, table }: DataGridCellProps<TData>) {
  const meta = table.options.meta;
  const originalRowIndex = cell.row.index;

  const rows = table.getRowModel().rows;
  const displayRowIndex = rows.findIndex(
    (row) => row.original === cell.row.original
  );
  const rowIndex = displayRowIndex >= 0 ? displayRowIndex : originalRowIndex;
  const columnId = cell.column.id;

  const isFocused =
    meta?.focusedCell?.rowIndex === rowIndex &&
    meta?.focusedCell?.columnId === columnId;
  const isEditing =
    meta?.editingCell?.rowIndex === rowIndex &&
    meta?.editingCell?.columnId === columnId;
  const isSelected = meta?.getIsCellSelected?.(rowIndex, columnId) ?? false;

  const cellOpts = cell.column.columnDef.meta?.cell;
  const variant = cellOpts?.variant ?? "text";

  switch (variant) {
    case "short-text":
      return (
        <ShortTextCell
          cell={cell}
          columnId={columnId}
          isEditing={isEditing}
          isFocused={isFocused}
          isSelected={isSelected}
          rowIndex={rowIndex}
          table={table}
        />
      );
    case "long-text":
      return (
        <LongTextCell
          cell={cell}
          columnId={columnId}
          isEditing={isEditing}
          isFocused={isFocused}
          isSelected={isSelected}
          rowIndex={rowIndex}
          table={table}
        />
      );
    case "number":
      return (
        <NumberCell
          cell={cell}
          columnId={columnId}
          isEditing={isEditing}
          isFocused={isFocused}
          isSelected={isSelected}
          rowIndex={rowIndex}
          table={table}
        />
      );
    case "url":
      return (
        <UrlCell
          cell={cell}
          columnId={columnId}
          isEditing={isEditing}
          isFocused={isFocused}
          isSelected={isSelected}
          rowIndex={rowIndex}
          table={table}
        />
      );
    case "checkbox":
      return (
        <CheckboxCell
          cell={cell}
          columnId={columnId}
          isEditing={isEditing}
          isFocused={isFocused}
          isSelected={isSelected}
          rowIndex={rowIndex}
          table={table}
        />
      );
    case "select":
      return (
        <SelectCell
          cell={cell}
          columnId={columnId}
          isEditing={isEditing}
          isFocused={isFocused}
          isSelected={isSelected}
          rowIndex={rowIndex}
          table={table}
        />
      );
    case "multi-select":
      return (
        <MultiSelectCell
          cell={cell}
          columnId={columnId}
          isEditing={isEditing}
          isFocused={isFocused}
          isSelected={isSelected}
          rowIndex={rowIndex}
          table={table}
        />
      );
    case "date":
      return (
        <DateCell
          cell={cell}
          columnId={columnId}
          isEditing={isEditing}
          isFocused={isFocused}
          isSelected={isSelected}
          rowIndex={rowIndex}
          table={table}
        />
      );
    case "file":
      return (
        <FileCell
          cell={cell}
          columnId={columnId}
          isEditing={isEditing}
          isFocused={isFocused}
          isSelected={isSelected}
          rowIndex={rowIndex}
          table={table}
        />
      );

    default:
      return (
        <ShortTextCell
          cell={cell}
          columnId={columnId}
          isEditing={isEditing}
          isFocused={isFocused}
          isSelected={isSelected}
          rowIndex={rowIndex}
          table={table}
        />
      );
  }
}
