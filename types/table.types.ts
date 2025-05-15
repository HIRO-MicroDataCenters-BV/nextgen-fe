import type { Row } from "@tanstack/vue-table";

export interface TableColumn {
  id: string;
  cell: (props: { row: Row<unknown> }) => unknown;
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

export interface SearchFilter {
  id: string;
  value: string | number;
  column?: string;
}
