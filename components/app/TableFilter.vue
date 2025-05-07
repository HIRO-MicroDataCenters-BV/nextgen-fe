<script setup lang="ts">
const { filter } = defineProps<{
  filter: {
    key: string;
    label: string;
  };
}>();
const emits = defineEmits(["filterValue"]);

const addFilter = (value: string) => {
  emits("filterValue", value);
};
</script>

<template>
  <Button
    variant="outline"
    class="border-dashed"
    @click="addFilter(filter.key)"
  >
    <Icon name="lucide:circle-plus" />
    {{ filter.label }}
  </Button>
</template>

<style scoped>

</style>
