<script setup lang="ts">
import type { HTMLAttributes, Ref } from "vue"
import { defaultDocument, useVModel } from "@vueuse/core"
import { TooltipProvider } from "reka-ui"
import { cn } from "@/lib/utils"
import { provideSidebarContext, SIDEBAR_COOKIE_MAX_AGE, SIDEBAR_COOKIE_NAME, SIDEBAR_WIDTH, SIDEBAR_WIDTH_ICON } from "./utils"
import { useSidebarStore } from "./composables/useSidebarStore"
import { useSidebarEffects } from "./composables/useSidebarEffects"

const props = withDefaults(defineProps<{
  defaultOpen?: boolean
  open?: boolean
  class?: HTMLAttributes["class"]
}>(), {
  defaultOpen: !defaultDocument?.cookie.includes(`${SIDEBAR_COOKIE_NAME}=false`),
  open: undefined,
  class: undefined,
})

const emits = defineEmits<{
  "update:open": [open: boolean]
}>()

const open = useVModel(props, "open", emits, {
  defaultValue: props.defaultOpen ?? false,
  passive: (props.open === undefined) as false,
}) as Ref<boolean>

const store = useSidebarStore({
  defaultOpen: props.defaultOpen ?? false,
  controlledOpen: open,
  onOpenChange: (value) => {
    document.cookie = `${SIDEBAR_COOKIE_NAME}=${value}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
  },
})
const { registerKeyboardShortcut } = useSidebarEffects({
  toggleSidebar: store.toggleSidebar,
})
registerKeyboardShortcut()

provideSidebarContext({
  state: store.state,
  open: store.open,
  setOpen: store.setOpen,
  isMobile: store.isMobile,
  openMobile: store.openMobile,
  setOpenMobile: store.setOpenMobile,
  toggleSidebar: store.toggleSidebar,
})
</script>

<template>
  <TooltipProvider :delay-duration="0">
    <div
      data-slot="sidebar-wrapper"
      :style="{
        '--sidebar-width': SIDEBAR_WIDTH,
        '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
      }"
      :class="cn(
        'group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex h-svh min-h-0 w-full overflow-hidden',
        props.class,
      )"
      v-bind="$attrs"
    >
      <slot />
    </div>
  </TooltipProvider>
</template>
