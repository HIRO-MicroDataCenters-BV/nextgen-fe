import { useEventListener } from "@vueuse/core";
import {
  SIDEBAR_COOKIE_MAX_AGE,
  SIDEBAR_COOKIE_NAME,
  SIDEBAR_KEYBOARD_SHORTCUT,
} from "../utils";

export const useSidebarEffects = ({
  setOpen,
  toggleSidebar,
}: {
  setOpen: (value: boolean) => void;
  toggleSidebar: () => void;
}) => {
  const persistOpenState = (value: boolean) => {
    document.cookie = `${SIDEBAR_COOKIE_NAME}=${value}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
  };

  const registerKeyboardShortcut = () => {
    useEventListener("keydown", (event: KeyboardEvent) => {
      if (
        event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault();
        toggleSidebar();
      }
    });
  };

  const setOpenWithEffects = (value: boolean) => {
    setOpen(value);
    persistOpenState(value);
  };

  return { registerKeyboardShortcut, setOpenWithEffects };
};
