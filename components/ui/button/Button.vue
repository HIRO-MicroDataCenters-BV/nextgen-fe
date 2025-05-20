<script setup lang="ts">
import { cn } from '@/lib/utils';
import { Primitive } from 'reka-ui';
import { buttonVariants } from '.';

const props = defineProps({
  variant: {
    type: String as () => 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link',
    default: 'default',
  },
  size: {
    type: String as () => 'default' | 'sm' | 'lg' | 'icon',
    default: 'default',
  },
  class: {
    type: String,
    default: '',
  },
  as: {
    type: String,
    default: 'button',
  },
  asChild: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <Primitive
    data-slot="button"
    :as="as"
    :as-child="asChild"
    :class="cn(buttonVariants({ variant, size }), props.class)"
  >
    <slot />
  </Primitive>
</template>
