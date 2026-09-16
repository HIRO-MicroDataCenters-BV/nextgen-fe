<script setup lang="ts">
interface Item {
  key: string;
  label: string;
  // Failure = resolves to false, null, or { error: true }; sync/void actions
  // (returning undefined) are treated as success.
  action: () => unknown;
  hasConfirmation?: boolean;
}

type ConfirmStatus = 'idle' | 'loading' | 'success' | 'error';

const { t } = useI18n();
const props = defineProps<{
  items: Item[];
  id: string;
  title: string;
}>();

const emit = defineEmits<{
  (e: 'expand' | 'completed'): void;
}>();

const isOpenConfirm = ref(false);
const activeItem = ref<Item | null>(null);
const status = ref<ConfirmStatus>('idle');

// Delete is irreversible — surface it with the destructive button styling.
const isDestructiveAction = computed(
  () => !!activeItem.value && activeItem.value.key.includes('delete'),
);

// Auto-close shortly after success so the user sees the message; errors stay open for retry.
const SUCCESS_CLOSE_DELAY = 1500;
let successTimer: ReturnType<typeof setTimeout> | null = null;
const clearSuccessTimer = () => {
  if (successTimer) {
    clearTimeout(successTimer);
    successTimer = null;
  }
};

const openConfirm = (item: Item) => {
  clearSuccessTimer();
  activeItem.value = item;
  status.value = 'idle';
  isOpenConfirm.value = true;
};

const closeConfirm = () => {
  clearSuccessTimer();
  const wasSuccess = status.value === 'success';
  isOpenConfirm.value = false;
  status.value = 'idle';
  if (wasSuccess) emit('completed');
};

// Treat the codebase's failure conventions (false / null / { error: true }) as
// failures; only a resolved non-failure (including void/undefined) is success.
const isActionFailure = (result: unknown): boolean =>
  result === false ||
  result === null ||
  (typeof result === 'object' &&
    result !== null &&
    (result as { error?: unknown }).error === true);

const runAction = async () => {
  if (!activeItem.value || status.value === 'loading') return;
  status.value = 'loading';
  try {
    const result = await activeItem.value.action();
    if (isActionFailure(result)) {
      status.value = 'error';
    } else {
      status.value = 'success';
      successTimer = setTimeout(closeConfirm, SUCCESS_CLOSE_DELAY);
    }
  } catch {
    status.value = 'error';
  }
};

// Keep the modal open while the request runs; reset/notify on close.
const onOpenChange = (value: boolean) => {
  if (value) {
    isOpenConfirm.value = true;
    return;
  }
  if (status.value === 'loading') return;
  closeConfirm();
};

onUnmounted(clearSuccessTimer);
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
              if (item.hasConfirmation) {
                openConfirm(item);
              } else {
                item.action();
              }
            }
          "
        >
          {{ t(`action.${item.key}`) }}
        </DropdownMenuItem>
      </template>
    </DropdownMenuContent>
  </DropdownMenu>

  <AlertDialog :open="isOpenConfirm" @update:open="onOpenChange">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          {{ status === 'success' ? t('title.done') : t('title.are_you_sure') }}
        </AlertDialogTitle>
        <AlertDialogDescription>
          <template v-if="status === 'loading'">{{ t('alert.processing') }}</template>
          <template v-else-if="status === 'success'">
            {{ activeItem ? t(`alert.${activeItem.key}_success`) : '' }}
          </template>
          <template v-else-if="status === 'error'">{{ t('alert.action_failed') }}</template>
          <template v-else>
            {{ activeItem ? t(`alert.${activeItem.key}`, { name: props.title }) : '' }}
          </template>
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div
        v-if="activeItem && status !== 'idle'"
        class="flex items-center gap-2 rounded-md border bg-muted px-3 py-2 text-sm font-semibold text-foreground"
      >
        <Icon
          v-if="status === 'loading'"
          name="lucide:loader-circle"
          class="size-4 shrink-0 animate-spin text-muted-foreground"
        />
        <Icon
          v-else-if="status === 'success'"
          name="lucide:circle-check"
          class="size-4 shrink-0 text-green-600"
        />
        <Icon
          v-else-if="status === 'error'"
          name="lucide:circle-alert"
          class="size-4 shrink-0 text-destructive"
        />
        <span>{{ props.title }}</span>
      </div>

      <AlertDialogFooter v-if="status !== 'success'">
        <template v-if="status === 'loading'">
          <Button disabled>
            <Icon name="lucide:loader-circle" class="mr-2 size-4 animate-spin" />
            {{ t('action.please_wait') }}
          </Button>
        </template>
        <template v-else-if="status === 'error'">
          <AlertDialogCancel>{{ t('action.cancel') }}</AlertDialogCancel>
          <Button
            :variant="isDestructiveAction ? 'destructive' : 'default'"
            @click="runAction"
          >
            {{ t('action.try_again') }}
          </Button>
        </template>
        <template v-else>
          <AlertDialogCancel>{{ t('action.cancel') }}</AlertDialogCancel>
          <Button
            :variant="isDestructiveAction ? 'destructive' : 'default'"
            @click="runAction"
          >
            {{ activeItem ? t(`action.${activeItem.key}`) : '' }}
          </Button>
        </template>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
