import type { Row } from "@tanstack/vue-table";

export interface TableColumn {
  id: string;
  header: () => string;
  cell: (props: { row: Row<TableRowData> }) => unknown;
  enableSorting?: boolean;
  enableHiding?: boolean;
}

export interface TableRowData {
  id: string;
  name: string;
  description: string;
  biobank: string;
  last_update: string;
  [key: string]: unknown;
}

export interface TableDataResponse {
  data: TableRowData[];
  pagination: {
    total_items: number;
    page: number;
    limit: number;
  };
}

export interface TableFilter {
  id: string;
  value: string | number;
  column?: string;
}

export interface DropdownMenuItem {
  key: string;
  label: string;
  children?: DropdownMenuItem[];
  type?: "checkbox" | "select";
  value?: string;
}

export interface TableDropdownFilterProps {
  id?: string;
  label?: string;
  items?: DropdownMenuItem[];
  column?: unknown;
}
