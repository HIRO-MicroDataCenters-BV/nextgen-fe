export interface MockDataItem {
  id: number;
  name: string;
  description: string;
  status: string;
  type: string;
  biobank: string;
  last_update: string;
}

export interface CatalogItem {
  id: string;
  name: string;
  biobank: string;
  description: string;
  last_update: string;
  [key: string]: string;
}

export interface TableFetchParams {
  page?: number;
  limit?: number;
  name?: string;
  description?: string;
  biobank?: string;
  lastupdate?: string;
  all?: string;
  filters?: Record<string, boolean>;
}

export interface TableDataResponse {
  data: Array<{
    id: string;
    name: string;
    description: string;
    biobank: string;
    last_update: string;
  }>;
  pagination: {
    total_items: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}
