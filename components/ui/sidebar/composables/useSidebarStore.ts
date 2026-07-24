import type { Ref } from "vue";
import { computed, onMounted, ref } from "vue";
import { useMediaQuery } from "@vueuse/core";

export const useSidebarStore = ({
  defaultOpen,
  controlledOpen,
  onOpenChange,
}: {
  defaultOpen: boolean;
  controlledOpen?: Ref<boolean | undefined>;
  onOpenChange: (value: boolean) => void;
}) => {
  // `useMediaQuery` evaluates to the real viewport synchronously on the client
  // but is always `false` during SSR (no viewport). That divergence breaks
  // hydration: on a narrow viewport the server renders the sidebar's desktop
  // `<div>` branch while the client renders the mobile `<Sheet>` branch. Because
  // the closed mobile Sheet does not render the sidebar content (its two
  // DropdownMenus), Reka UI's shared `useId` counter — which delegates to Vue's
  // `useId()` — advances a different number of times on the server vs the
  // client, drifting every downstream Reka id (Tabs, table DropdownFilter, …).
  // Gate the query behind a mounted flag so SSR and the initial client render
  // agree (desktop), then switch to the real value after mount.
  const mounted = ref(false);
  onMounted(() => {
    mounted.value = true;
  });
  const matchesMobile = useMediaQuery("(max-width: 768px)");
  const isMobile = computed(() => mounted.value && matchesMobile.value);
  const openMobile = ref(false);
  const internalOpen = ref(defaultOpen);

  const open = computed<boolean>({
    get: () => controlledOpen?.value ?? internalOpen.value,
    set: (value) => {
      if (controlledOpen) {
        controlledOpen.value = value;
      } else {
        internalOpen.value = value;
      }
      onOpenChange(value);
    },
  });

  const setOpen = (value: boolean) => {
    open.value = value;
  };

  const setOpenMobile = (value: boolean) => {
    openMobile.value = value;
  };

  const toggleSidebar = () => {
    if (isMobile.value) {
      setOpenMobile(!openMobile.value);
    } else {
      setOpen(!open.value);
    }
  };

  const state = computed(() => (open.value ? "expanded" : "collapsed"));

  return { isMobile, openMobile, open, setOpen, setOpenMobile, toggleSidebar, state };
};
