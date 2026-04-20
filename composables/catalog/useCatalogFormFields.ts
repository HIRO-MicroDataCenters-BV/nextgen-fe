import type { FormFieldDefinition } from "~/types/app-form.types";

type Translator = (key: string) => string;

interface UseCatalogFormFieldsOptions {
  t: Translator;
  mode: "create" | "edit";
  getDataproductsForClient?: () => Promise<unknown>;
}

const datasetCondition = [{ field: "item_type", value: "dataset" }];

export const useCatalogFormFields = ({
  t,
  mode,
  getDataproductsForClient,
}: UseCatalogFormFieldsOptions) => {
  const isEdit = mode === "edit";

  const baseFields: FormFieldDefinition[] = [
    {
      name: "item_type",
      label: t("label.item_type"),
      type: "select",
      placeholder: t("placeholder.select_data_product_directory"),
      options: [
        { label: t("label.dataset"), value: "dataset" },
        { label: t("label.application"), value: "application" },
      ],
      disabled: isEdit,
    },
    {
      name: "related_data_product",
      label: t("label.related_data_product"),
      type: "select",
      placeholder: t("placeholder.select_data_product"),
      dataSource: isEdit
        ? async () => ({ dataproducts: [] as string[] })
        : getDataproductsForClient,
      fieldOptions: {
        dataPath: "dataproducts",
      },
      hint: isEdit ? null : t("hint.related_data_product_required"),
      disabled: isEdit,
      conditions: datasetCondition,
    },
    {
      name: "file",
      label: t("label.file"),
      type: "file",
      placeholder: t("placeholder.select_file"),
      hint: t("hint.accepted_file_types_json_jar"),
      accept: "application/json, application/x-tar",
      disabled: isEdit,
    },
    {
      name: "metadata_content",
      label: t("label.metadata_content"),
      type: "jsonld-editor",
      placeholder: t("placeholder.enter_metadata_content"),
      hint: null,
    },
  ];

  if (!isEdit) {
    return [
      {
        name: "name",
        label: t("label.name"),
        type: "text",
        placeholder: t("placeholder.name_from_metadata"),
        disabled: true,
      },
      baseFields[0],
      {
        name: "client_selector",
        label: "",
        type: "client-selector",
        conditions: datasetCondition,
      },
      ...baseFields.slice(1),
    ];
  }

  return baseFields;
};
