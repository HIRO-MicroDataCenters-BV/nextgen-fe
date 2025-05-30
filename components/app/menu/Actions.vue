<script setup lang="ts">
interface Item {
  key: string;
  label: string;
  action: () => void;
  hasConfirmation?: boolean;
}

const { t } = useI18n();
const props = defineProps<{
  items: Item[];
  id: string;
  title: string;
}>();

defineEmits<{
  (e: 'expand'): void;
}>();

const isOpenDelete = ref(false);

const action = ref();
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" class="h-8 w-8 p-0">
        <span class="sr-only">{{ $t('hint.open_menu') }}</span>
        <div class="h-4 w-4">
          <Icon name="lucide:ellipsis" />
        </div>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>{{ $t('title.actions') }}</DropdownMenuLabel>

      <template v-for="item in props.items" :key="item.key">
        <DropdownMenuItem
          @click="
            () => {
              action = item.action;
              console.log(item);
              if (item.hasConfirmation) {
                if (item.key.includes('delete')) {
                  console.log('delete');
                  isOpenDelete = true;
                }
              } else {
                action();
              }
            }
          "
        >
          {{ t(`action.${item.key}`) }}
        </DropdownMenuItem>
      </template>
    </DropdownMenuContent>
  </DropdownMenu>

  <AlertDialog :open="isOpenDelete" @update:open="isOpenDelete = $event">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ t('title.are_you_sure') }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ t('alert.delete_dataset', { name: props.title }) }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>{{ t('action.cancel') }}</AlertDialogCancel>
        <AlertDialogAction
          variant="destructive"
          @click="
            () => {
              action();
            }
          "
          >{{ t('action.delete') }}</AlertDialogAction
        >
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
