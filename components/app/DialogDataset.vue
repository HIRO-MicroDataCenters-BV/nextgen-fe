<script setup lang="ts">
const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["on-close"]);

const handleClose = () => {
  emit("on-close");
};

const { t } = useI18n();
</script>

<template>
  <Dialog :open="open" @update:open="handleClose">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{{ t("title.add_dataset") }}</DialogTitle>
        <DialogDescription>
          {{ t("subtitle.add_dataset_description") }}
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="name" class="text-right">
            {{ t("label.name") }}
          </Label>
          <Input id="name" class="col-span-3" />
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="biobank" class="text-right">
            {{ t("label.biobank") }}
          </Label>
          <Input id="biobank" class="col-span-3" />
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="description" class="text-right">
            {{ t("label.description") }}
          </Label>
          <Textarea id="description" class="col-span-3" />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit">{{ t("action.save") }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
