import type { ColumnDef } from "@tanstack/react-table";
import { CheckCircleIcon, CircleOff, EyeIcon, LoaderIcon, Text } from "lucide-react";
import React from "react";
import { v4 as uuidv4 } from "uuid";
import { useDataTable } from "@/hooks/use-data-table";
import { cn } from "@/lib/utils";
import { DataTable } from "../data-table/data-table";
import { DataTableAdvancedToolbar } from "../data-table/data-table-advanced-toolbar";
import { DataTableColumnHeader } from "../data-table/data-table-column-header";
import { DataTableFilterList } from "../data-table/data-table-filter-list";
import { DataTableSortList } from "../data-table/data-table-sort-list";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

const data = [
  {
    id: uuidv4(),
    paymentId: "xy-1780",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    firstname: "John",
    lastname: "Doe",
    email: "john.doe@example.com",
    date: "2025-06-09",
    status: "processing" as const,
    amount: 125.0,
    method: "stripe",
    remark: "Recurring monthly subscription",
  },
  {
    id: uuidv4(),
    paymentId: "re-128320",
    avatar: "https://randomuser.me/api/portraits/women/45.jpg",
    firstname: "Jane",
    lastname: "Smith",
    email: "jane.smith@example.com",
    date: "2025-06-07",
    status: "completed" as const,
    amount: 299.5,
    method: "paypal",
    remark: "Annual license payment",
  },
  {
    id: uuidv4(),
    paymentId: "xy-2321",
    avatar: "https://randomuser.me/api/portraits/men/64.jpg",
    firstname: "Michael",
    lastname: "Brown",
    email: "michael.brown@example.com",
    date: "2025-06-08",
    status: "failed" as const,
    amount: 49.99,
    method: "paystact",
    remark: "Card declined",
  },
  {
    id: uuidv4(),
    paymentId: "re-155301",
    avatar: "https://randomuser.me/api/portraits/men/11.jpg",
    firstname: "Andrew",
    lastname: "Wilson",
    email: "andrew.wilson@example.com",
    date: "2025-06-06",
    status: "completed" as const,
    amount: 88.0,
    method: "bank transfer",
    remark: "One-time fee",
  },
  {
    id: uuidv4(),
    paymentId: "xy-3210",
    avatar: "https://randomuser.me/api/portraits/women/23.jpg",
    firstname: "Emily",
    lastname: "Clark",
    email: "emily.clark@example.com",
    date: "2025-06-05",
    status: "processing" as const,
    amount: 59.99,
    method: "stripe",
    remark: "Subscription renewal",
  },
  {
    id: uuidv4(),
    paymentId: "re-267890",
    avatar: "https://randomuser.me/api/portraits/women/33.jpg",
    firstname: "Olivia",
    lastname: "Nguyen",
    email: "olivia.nguyen@example.com",
    date: "2025-05-30",
    status: "failed" as const,
    amount: 210.0,
    method: "paypal",
    remark: "Payment error",
  },
  {
    id: uuidv4(),
    paymentId: "xy-1876",
    avatar: "https://randomuser.me/api/portraits/men/91.jpg",
    firstname: "David",
    lastname: "Baker",
    email: "david.baker@example.com",
    date: "2025-05-25",
    status: "completed" as const,
    amount: 150,
    method: "bank transfer",
    remark: "Consulting fee",
  },
  {
    id: uuidv4(),
    paymentId: "re-139801",
    avatar: "https://randomuser.me/api/portraits/men/55.jpg",
    firstname: "Satoshi",
    lastname: "Tanaka",
    email: "satoshi.tanaka@example.com",
    date: "2025-05-22",
    status: "processing" as const,
    amount: 79.99,
    method: "paystact",
    remark: "Setup fee",
  },
  {
    id: uuidv4(),
    paymentId: "xy-4545",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    firstname: "Sophia",
    lastname: "Martinez",
    email: "sophia.martinez@example.com",
    date: "2025-05-20",
    status: "completed" as const,
    amount: 245.49,
    method: "stripe",
    remark: "Quarterly payment",
  },
  {
    id: uuidv4(),
    paymentId: "re-102938",
    avatar: "https://randomuser.me/api/portraits/men/27.jpg",
    firstname: "Liam",
    lastname: "Murphy",
    email: "liam.murphy@example.com",
    date: "2025-05-18",
    status: "failed" as const,
    amount: 25.0,
    method: "paypal",
    remark: "Transaction failed",
  },
];

// Remove implicit any warning for columns

const pageCount = 1;
type RevenueRow = (typeof data)[number];

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox"; // Make sure your Checkbox import path is correct
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";

export function RevenueTable() {
  const columns: ColumnDef<RevenueRow>[] = [
    // Selection/Checkbox column - must be first!
    {
      id: "select",
      header: ({ table: headerTable }) => {
        const isAllSelected = headerTable.getIsAllPageRowsSelected();
        const isSomeSelected = headerTable.getIsSomePageRowsSelected();

        let checked: boolean | "indeterminate" = false;
        if (isAllSelected) {
          checked = true;
        } else if (isSomeSelected) {
          checked = "indeterminate";
        }

        return (
          <Checkbox
            aria-label="Select all"
            checked={checked}
            className="mx-2"
            onCheckedChange={(value) => {
              headerTable.toggleAllPageRowsSelected(value === true);
            }}
          />
        );
      },
      cell: ({ row }) => (
        <Checkbox
          aria-label="Select row"
          checked={row.getIsSelected()}
          className="mx-2"
          disabled={!row.getCanSelect()}
          onCheckedChange={(checked) => row.toggleSelected(checked === true)}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 32, // Optional: for column sizing
      meta: {
        label: "select",
      },
    },
    {
      id: "paymentId",
      accessorKey: "paymentId",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          label="Payment Id"
          title="payment id"
        />
      ),
      cell: ({ row }) => <div>{row.getValue("paymentId")}</div>,
      meta: {
        label: "payment id",
        placeholder: "Search payment id...",
        variant: "text",
        icon: Text,
      },
      enableColumnFilter: true,
    },
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Name" title="Name" />
      ),
      cell: ({ row }) => {
        const customer = row.original;

        return (
          <div className="flex items-center gap-1">
            <Avatar className="size-4 sm:size-5">
              <AvatarImage
                alt={`${customer.firstname} ${customer.lastname}`}
                src={customer.avatar}
              />
              <AvatarFallback>
                {customer.firstname?.charAt(0)}
                {customer.lastname?.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <span className="truncate text-xs capitalize sm:text-sm">
              {`${customer.firstname ?? ""} ${customer.lastname ?? ""}`.trim()}
            </span>
          </div>
        );
      },
      meta: {
        label: "name",
        placeholder: "Search name...",
        variant: "text",
        icon: Text,
      },
      enableColumnFilter: true,
    },
    {
      id: "email",
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Email" title="email" />
      ),
      cell: ({ row }) => (
        <div className="truncate">{row.getValue("email")}</div>
      ),
      meta: {
        label: "email",
        placeholder: "Search email...",
        variant: "text",
        icon: Text,
      },
      enableColumnFilter: true,
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Status" title="status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue("status");
        return (
          <div
            className={cn(
              "flex size-fit items-center gap-1 rounded-full px-2 py-1 text-xs capitalize sm:text-sm [&>svg]:size-3 sm:[&>svg]:size-4",
              { "bg-green-500/30": status === "completed" },
              { "bg-blue-500/30": status === "processing" },
              { "bg-red-500/30": status === "failed" }
            )}
          >
            {(() => {
              if (status === "completed") {
                return <CheckCircleIcon />;
              }
              if (status === "processing") {
                return <LoaderIcon />;
              }
              return <CircleOff />;
            })()}

            <span>{status as string}</span>
          </div>
        );
      },
    },
    {
      id: "method",
      accessorKey: "method",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Method" title="method" />
      ),
      cell: ({ row }) => (
        <div className="lowercase">{row.getValue("method")}</div>
      ),
      meta: {
        label: "method",
        placeholder: "Search method...",
        variant: "text",
        icon: Text,
      },
      enableColumnFilter: true,
    },
    {
      id: "amount",
      accessorKey: "amount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Amount" title="amount" />
      ),
      cell: ({ row }) => (
        <div className="truncate">${row.getValue("amount")}</div>
      ),
      meta: {
        label: "amount",
        placeholder: "Search amount...",
        variant: "text",
        icon: Text,
      },
      enableColumnFilter: true,
    },
    {
      id: "date",
      accessorKey: "date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Date" title="date" />
      ),
      cell: ({ row }) => <div className="truncate">{row.getValue("date")}</div>,
      enableColumnFilter: true,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row, table }) => {
        const rowData = row.original;
        const [openView, setOpenView] = useState(false);
        const [openDelete, setOpenDelete] = useState(false);
        // We'll simulate delete by removing from the table: (in real project, connect this with a mutation or redux, etc.)

        // Remove row from table state
        function handleDelete() {
          // Assumes that "data" is controlled outside; in real usage, lift this up.
          // Here, a no-op for demonstration. Could provide a callback prop via RevenueTable if real delete needed.
          setOpenDelete(false);
          // You may want to add notification/toast here
        }

        return (
          <div className="flex items-center gap-2">
            {/* View Dialog */}
            <React.Fragment>
              <button
                aria-label="View Row"
                className="rounded p-1 hover:bg-muted"
                onClick={() => setOpenView(true)}
                title="View Row"
                type="button"
              >
                <span aria-label="View" role="img">
                  👁️
                </span>
              </button>
              <Dialog onOpenChange={setOpenView} open={openView}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Revenue Row Information</DialogTitle>
                    <DialogDescription>
                      Details of revenue entry <b>{rowData.paymentId}</b>
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <img
                        alt="Avatar"
                        className="size-10 rounded-full"
                        src={rowData.avatar}
                      />
                      <div>
                        <div className="font-semibold">
                          {rowData.firstname} {rowData.lastname}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {rowData.email}
                        </div>
                      </div>
                    </div>
                    <div>
                      <b>Status:</b> {rowData.status}
                    </div>
                    <div>
                      <b>Amount:</b> ${rowData.amount}
                    </div>
                    <div>
                      <b>Method:</b> {rowData.method}
                    </div>
                    <div>
                      <b>Date:</b> {rowData.date}
                    </div>
                    <div>
                      <b>Remark:</b> {rowData.remark}
                    </div>
                    <div>
                      <b>Payment ID:</b> {rowData.paymentId}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => setOpenView(false)}
                      type="button"
                      variant="outline"
                    >
                      Close
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </React.Fragment>
            {/* Delete Dialog */}
            <React.Fragment>
              <button
                aria-label="Delete Row"
                className="rounded p-1 hover:bg-muted"
                onClick={() => setOpenDelete(true)}
                style={{ color: "var(--destructive)" }}
                title="Delete Row"
                type="button"
              >
                <span aria-label="Delete" role="img">
                  🗑️
                </span>
              </button>
              <Dialog onOpenChange={setOpenDelete} open={openDelete}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Revenue Row?</DialogTitle>
                  </DialogHeader>
                  <div>
                    Are you sure you want to delete{" "}
                    <span className="font-semibold">
                      {rowData.firstname} {rowData.lastname}
                    </span>
                    's payment? This action cannot be undone.
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => setOpenDelete(false)}
                      type="button"
                      variant="outline"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        table.options.meta?.onDeleteRow?.(rowData.id); // Use meta handler for delete if provided
                        handleDelete();
                      }}
                      type="button"
                      variant="destructive"
                    >
                      Delete
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </React.Fragment>
          </div>
        );
      },
      size: 90,
      enableSorting: false,
      enableHiding: false,
      meta: {
        label: "Actions",
      },
    },
  ];

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    initialState: {
      sorting: [{ id: "date", desc: true }],
      pagination: { pageSize: 10, pageIndex: 1 },
      rowSelection: {}, // Enable row selection state
    },
    getRowId: (row) => row.id,
    enableRowSelection: true, // <-- Important!
    enableMultiRowSelection: true, // <-- Enable multi selection (Select All)
  });

  return (
    <div>
      <DataTable table={table}>
        <DataTableAdvancedToolbar table={table}>
          <DataTableFilterList table={table} />
          <DataTableSortList table={table} />
        </DataTableAdvancedToolbar>
        {table.getRowModel().rows.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <div className="text-4xl">🗃️</div>
            <div className="font-semibold text-lg">No revenue rows found</div>
            <div className="text-muted-foreground text-sm">
              There are no records to show for this period. Try adjusting your
              filters or date range.
            </div>
          </div>
        )}
      </DataTable>
    </div>
  );
}

function ViewDialog({row}){
  return(
    <Dialog>
      <DialogTrigger asChild>
        <Button className="flex gap-1"><EyeIcon /> View</Button>
      </DialogTrigger>
      <DialogContent>
        
      </DialogContent>
    </Dialog>
  )
}
