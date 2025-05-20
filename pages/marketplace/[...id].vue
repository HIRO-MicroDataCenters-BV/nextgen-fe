<template>
    <AppContent :title="page.title" :description="page.subtitle" :show-available-biobanks="false">
        <div v-if="content" class="px-10">
      <Table class="w-full table-fixed">
        <TableBody>
          <TableRow
            v-for="(item, index) in schema"
            :key="`content-item-${index}`"
          >
            <TableCell class="text-left pb-4 pr-8 border-none text-gray-400 uppercase">{{
              t(`label.${item.key}`)
            }}</TableCell>
            <TableCell class="text-left pb-4 pr-8 border-none flex flex-wrap gap-2 py-8">
              <template v-if="item.type === 'text'">
                {{ content[item.key] }}
              </template>
              <template v-if="item.type === 'date'">
                {{ dayjs(content[item.key]).format('YYYY-MM-DD HH:mm:ss') }}
              </template>
              <template v-if="item.type === 'array'">
                <span v-for="field in content[item.key]" :key="field" class="rounded-md">{{ field }}</span>
              </template>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
    </AppContent>
  </template>
  
  <script lang="ts" setup>
  const { t } = useI18n();
  const dayjs = useDayjs();
  //const { fetchDatasets } = useApi();
  const { setPage, page } = useApp();
  const content = ref();
  const schema = [
    {
        key: "theme",
        type: "array",
    },
    {
        key: "creator",
        type: "text",
    },
    {
        key: "license",
        type: "text",
    },
    {
        key: "issued",
        type: "date",
    },
    {
        key: "last_update",
        type: "date",
    },
  ];
  
  onMounted(async () => {
    content.value = {
      theme: ["Clinical", "Genomics"],
      creator: "EMBL_EBI",
      license: "Open Access",
      issued: "2021-01-01 00:45:00",
      last_update: "2024-01-01 02:13:00",
      title: "Biobank",
      description: "Biobank description",
    };
    setPage({
        section: 'marketplace',
        title: content.value.title as string,
        subtitle: content.value.description as string,
    });
    /*
    const res = await fetchDatasets({ id: id.value });
    if (res && 'data' in res && res.data && Array.isArray(res.data)) {
      const data = res.data;
      content.value = data[0];
      if (content.value) {
        console.log(content);
        setPage({
          section: 'dataset_management',
          title: content.value.dataset_name as string,
          subtitle: content.value.description as string,
        });
      }
    }
      */
  });
  </script>
  
  <style></style>
  