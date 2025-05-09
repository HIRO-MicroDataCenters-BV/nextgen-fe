<script setup lang="ts">
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'

const { t } = useI18n();
const { title, description = ""} = defineProps<{
  title: string;
  description?: string;
}>();

const availableBiobanks = ref([
{
    key: "umcu",
    icon: "umcu",
    label: "UMCU",
    url: "./umcu",
  },
  {
    key: "ki",
    icon: "ki",
    label: "KI",
    url: "./KI",
  },
  {
    key: "hus",
    icon: "hus",
    label: "HUS",
    url: "./hus",
  },
  {
    key: "uva",
    icon: "uva",
    label: "UVA",
    url: "./uva",
  },
  {
    key: "tum",
    icon: "tum",
    label: "TUM",
    url: "./tum",
  },
  
]);
</script>

<template>
  <div class="px-14 py-6 border-t border-b flex flex-row gap-2 items-end">
    <div class="flex-auto">
      <div class="flex items-center">
      <h1 class="text-lg font-semibold">
        {{ title }}
      </h1>
    </div>
    <p class="text-small text-muted-foreground">
      {{ description }}
    </p>
    </div>
    <div>
      <Popover>
        <PopoverTrigger>
          <Button variant="secondary">{{ t('action.available_biobanks') }}</Button>
        </PopoverTrigger>
        <PopoverContent class=" p-2" align="end">
          <div class="mb-2">
            <h5 class="text-sm font-semibold mb-2">{{ t('subtitle.available_biobanks') }}</h5>
            <p class="text-sm text-muted-foreground text-black">{{ t('text.available_biobank_description') }}</p>
          </div>
            <Command>
              <CommandList>
                <CommandGroup>
                <CommandItem v-for="item in availableBiobanks" :key="item.key" :value="item" class="p-0">
                  <Button :href="item.url" class="flex p-2 w-full flex gap-2 text-left items-start justify-start" variant="ghost">
                    <span><img :src="`/images/icons/${item.icon}.png`" /></span>
                    <span>{{ item.label }}</span>
                  </Button>
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          
        </PopoverContent>
      </Popover>
      
    </div>
  </div>
  <div class="content-slot">
    <slot/>
  </div>
</template>
