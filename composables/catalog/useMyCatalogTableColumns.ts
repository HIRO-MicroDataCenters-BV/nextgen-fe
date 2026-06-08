import { h, type Ref } from "vue";
import type { TableColumn } from "~/types/table.types";
import type { CatalogItem } from "~/types/catalog.types";
import type { DatasetMetadata } from "~/types/jsonld.types";
import { Button } from "@/components/ui/button";
import DropdownAction from "~/components/app/menu/Actions.vue";

type TableRef = Ref<{ fetchData: () => void } | null | undefined>;

export const useMyCatalogTableColumns = (tableRef: TableRef) => {
  const { t } = useI18n();
  const dayjs = useDayjs();
  const router = useRouter();
  const { deleteDataset, shareDataset, unshareDataset } = useApi();

  const columns: TableColumn[] = [
    {
      id: "name",
      icon: "lucide:text",
      header: () => t("label.data_product_name"),
      cell: ({ row }) => {
        const item = row.original as CatalogItem;
        const id = item.id;

        return h(
          Button,
          {
            href: `/my_catalog/${id}`,
            as: "a",
            variant: "link",
          },
          () => [row.getValue("name") as string],
        );
      },
    },
    {
      id: "issued",
      icon: "lucide:calendar",
      header: () => t("label.issued"),
      cell: ({ row }) => {
        const raw = row.getValue("issued") as string;
        if (!raw || !String(raw).trim()) return "—";
        const d = dayjs(raw);
        return d.isValid() ? d.format("DD/MM/YYYY") : "—";
      },
    },
    {
      id: "actions",
      icon: "lucide:circle-plus",
      iconOnly: true,
      header: () => t("label.actions"),
      cell: ({ row }) => {
        const item = row.original as unknown as DatasetMetadata;
        const id = item.id;
        const isShared = item.isShared;

        return h(DropdownAction, {
          title: row.getValue("name") as string,
          id,
          onCompleted: () => tableRef.value?.fetchData(),
          items: [
            {
              key: isShared ? "unshare_dataset" : "share_dataset",
              label: isShared ? "unshare_dataset" : "share_dataset",
              hasConfirmation: true,
              action: () =>
                isShared
                  ? unshareDataset(id, { showToast: false })
                  : shareDataset(id, { showToast: false }),
            },
            {
              key: "edit_dataset",
              label: "edit_dataset",
              action: () => {
                router.push(`/my_catalog/${id}/edit`);
              },
            },
            {
              key: "delete_dataset",
              label: "delete_dataset",
              hasConfirmation: true,
              action: () => deleteDataset(id, { showToast: false }),
            },
          ],
        });
      },
    },
  ];

  return { columns };
};
