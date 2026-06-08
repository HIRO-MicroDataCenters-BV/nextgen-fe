import { h } from "vue";
import type { TableColumn } from "~/types/table.types";
import type { CatalogItem } from "~/types/catalog.types";
import Button from "@/components/ui/button/Button.vue";

export const useMarketplaceTableColumns = (baseUrl: string) => {
  const { t } = useI18n();
  const dayjs = useDayjs();

  const columns: TableColumn[] = [
    {
      id: "name",
      icon: "lucide:text",
      header: () => t("column.name"),
      cell: ({ row }) => {
        const item = row.original as CatalogItem;
        const id = item.id;

        return h(
          Button,
          {
            as: "a",
            variant: "link",
            class: "p-0",
            href: `${baseUrl}/${id}`,
          },
          {
            default: () => String(row.getValue("name") ?? ""),
          },
        );
      },
    },
    {
      id: "biobank",
      icon: "lucide:users",
      header: () => t("column.biobank"),
      cell: ({ row }) => row.getValue("biobank"),
    },
    {
      id: "issued",
      icon: "lucide:calendar",
      header: () => t("column.issued"),
      cell: ({ row }) => dayjs(row.getValue("issued")).format("DD/MM/YYYY"),
    },
  ];

  return { columns };
};
