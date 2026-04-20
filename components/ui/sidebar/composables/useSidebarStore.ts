import type { Ref } from "vue";
import { computed, ref } from "vue";
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
  const isMobile = useMediaQuery("(max-width: 768px)");
  const openMobile = ref(false);
  const internalOpen = ref(defaultOpen);

  const open = computed<boolean>({
    get: () => controlledOpen?.value ?? internalOpen.value,
    set: (value) => {
      internalOpen.value = value;
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
