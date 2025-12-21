import type { Row } from "@tanstack/vue-table";

export interface TableColumn {
  id: string;
  header: () => string;
  cell: (props: { row: Row<TableRowData> }) => unknown;
  enableSorting?: boolean;
  enableHiding?: boolean;
  icon?: string; // Lucide icon name, e.g., "lucide:user", "lucide:calendar"
  iconOnly?: boolean; // If true, only shows the icon without text
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
  originals?: unknown[];
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
  type?: "checkbox" | "select" | "text" | "number";
  value?: string | number | boolean;
}

export interface TableDropdownFilterProps {
  id?: string;
  label?: string;
  items?: DropdownMenuItem[];
  column?: unknown;
  multiple?: boolean;
  selectedValues?: string[];
}
