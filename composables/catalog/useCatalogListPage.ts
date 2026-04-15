import { ref } from "vue";
import type {
  TableDataResponse,
  TableFetchParams,
} from "~/types/catalog.types";
import type { JsonLdResponse } from "~/types/jsonld.types";
import type { SearchFilter } from "~/types/api.types";
import {
  createFiltersObject,
  createTableSearchFilter,
  transformSearchResponseToTableData,
} from "~/utils/jsonld";

type CatalogSource = "local" | "distributed";

interface UseCatalogListPageOptions {
  source: CatalogSource;
  api: {
    getLocalCatalog: (filter: SearchFilter) => Promise<unknown>;
    searchDistributed: (filter: SearchFilter) => Promise<unknown>;
    checkout: (
      datasets: Array<Record<string, unknown>>,
    ) => Promise<{ order_id: string; status: string } | null>;
  };
}

export const useCatalogListPage = ({ source, api }: UseCatalogListPageOptions) => {
  const showSuccessDialog = ref(false);
  const successData = ref<{
    status_code: number;
    message: string;
    data: {
      id: string;
      pipeline_name: string;
      order_id: string;
      status: string;
    };
  } | null>(null);

  const handlePassToTraining = async (payload: {
    dataset: Array<Record<string, unknown>>;
  }) => {
    const checkoutResponse = await api.checkout(payload.dataset);
    if (!checkoutResponse) return;
    successData.value = {
      status_code: 201,
      message: "Order created successfully",
      data: {
        id: "",
        pipeline_name: "",
        order_id: checkoutResponse.order_id,
        status: "CREATED",
      },
    };
    showSuccessDialog.value = true;
  };

  const fetchTableData = async (
    paramsAsUnknown: unknown,
  ): Promise<TableDataResponse> => {
    const params = paramsAsUnknown as TableFetchParams;
    try {
      const page = Math.max(1, params.page || 1);
      const limit = Math.max(1, params.limit || 3);
      const filtersObj = createFiltersObject(
        (params.filters || {}) as Record<string, unknown>,
      );
      const filter = createTableSearchFilter({
        name: params.name,
        description: params.description,
        biobank: params.biobank,
        lastupdate: params.lastupdate,
        all: params.all,
        type: params.type,
        page,
        limit,
        filters: filtersObj.length > 0 ? filtersObj : undefined,
      });
      const response =
        source === "local"
          ? await api.getLocalCatalog(filter as SearchFilter)
          : await api.searchDistributed(filter as SearchFilter);

      const tableData = transformSearchResponseToTableData(
        response as JsonLdResponse,
        page,
        limit,
      );
      const totalPages = Math.ceil(tableData.pagination.total_items / limit);
      return {
        data: tableData.data,
        pagination: {
          ...tableData.pagination,
          total_pages: totalPages,
          has_next: page < totalPages,
          has_prev: page > 1,
        },
        originals: tableData.originals,
      };
    } catch {
      return {
        data: [],
        pagination: {
          total_items: 0,
          page: params.page || 1,
          limit: params.limit || 3,
          total_pages: 0,
          has_next: false,
          has_prev: false,
        },
      };
    }
  };

  return {
    showSuccessDialog,
    successData,
    handlePassToTraining,
    fetchTableData,
  };
};
