import type { Row } from "@tanstack/vue-table";

export interface TableColumn {
  id: string;
  header: () => string;
  cell: (props: { row: Row<unknown> }) => unknown;
  enableSorting?: boolean;
  enableHiding?: boolean;
}

export interface TableDataResponse {
  data: DataItem[];
  pagination?: {
    total_items: number;
    page: number;
    limit: number;
  };
}

export interface DataItem {
  id: string;
  [key: string]: unknown;
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
}

export interface TableDropdownFilterProps {
  id?: string;
  label?: string;
  items?: DropdownMenuItem[];
  column?: unknown;
}
