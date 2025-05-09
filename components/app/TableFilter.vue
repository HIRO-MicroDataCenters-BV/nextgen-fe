<script setup lang="ts">
import { useFilter } from 'reka-ui';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { cn } from '@/lib/utils';

const { t } = useI18n();
const props = withDefaults(
  defineProps<{
    id: string,
    label: string,
    items: {key: string, label: string}[],
    column?: any
  }>(),
  {
    id: "",
    label: "",
    items: () => [],
  }
);

const id = ref(props.id);
const label = ref(props.label);
const items = ref(props.items);
const values = ref<string[]>([]);
const open = ref(false);
const q = ref('');
const selectedValues = ref<string[]>([]);

const handleSelect = (option: { key: string, label: string }) => {
  const isSelected = selectedValues.value.includes(option.label);
  if (isSelected) {
    const index = selectedValues.value.indexOf(option.label);
    selectedValues.value.splice(index, 1);
  } else {
    selectedValues.value.push(option.label);
  }
};
</script>

<template>
  <Popover>
    <PopoverTrigger>
      <Button variant="outline" size="sm" class="h-8 border-dashed">
        <Icon name="lucide:circle-plus" class="mr-2 h-4 w-4" />
        {{ label }}
        <template v-if="selectedValues.length > 0">
          <Separator orientation="vertical" class="mx-2 h-4" />
          <Badge
            variant="secondary"
            class="rounded-sm px-1 font-normal lg:hidden"
          >
            {{ selectedValues.length }}
          </Badge>
          <div class="hidden space-x-1 lg:flex">
            <Badge
              v-if="selectedValues.length > 2"
              variant="secondary"
              class="rounded-sm px-1 font-normal"
            >
              {{ selectedValues.length }} selected
            </Badge>

            <template v-else>
              <Badge
                v-for="option in items
                  .filter((option) => selectedValues.includes(option.label))"
                :key="option.key"
                variant="secondary"
                class="rounded-sm px-1 font-normal"
              >
                {{ option.label }}
              </Badge>
            </template>
          </div>
        </template>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-[200px] p-0" align="start">
      <Command>
        <CommandInput :placeholder="t('placeholder.search')" v-model="q" />
        <CommandList>
          <CommandEmpty/>
          <CommandGroup>
            <CommandItem
              v-for="option in items"
              :key="option.key"
              :value="option"
              @select="handleSelect(option)"
            >
              <div
                :class="cn(
                  'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                  selectedValues.includes(option.label)
                    ? 'bg-primary text-primary-foreground'
                    : 'opacity-50 [&_svg]:invisible',
                )"
              >
                <Icon name="lucide:check" :class="cn('h-4 w-4')" />
              </div>
              
              <span>{{ option.label }}</span>
            </CommandItem>
          </CommandGroup>

          <template v-if="selectedValues.length > 0">
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                value="clear-filters"
                class="justify-center text-center p-2"
                @select="selectedValues = []"
              >
                {{ t('action.clear_filters') }}
              </CommandItem>
            </CommandGroup>
          </template>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>

<style scoped>

</style>
