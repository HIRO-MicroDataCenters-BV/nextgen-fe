import type { Row } from "@tanstack/vue-table";

export interface TableColumn {
  id: string;
  cell: (props: { row: Row<any> }) => any;
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
  [key: string]: any;
}

export interface SearchFilter {
  id: string;
  value: string | number;
  column?: string;
}

export interface TableRowType extends Row<any> {}
