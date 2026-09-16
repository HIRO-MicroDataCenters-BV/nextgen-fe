import { useEventListener } from "@vueuse/core";
import { SIDEBAR_KEYBOARD_SHORTCUT } from "../utils";

export const useSidebarEffects = ({
  toggleSidebar,
}: {
  toggleSidebar: () => void;
}) => {
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

  return { registerKeyboardShortcut };
};
