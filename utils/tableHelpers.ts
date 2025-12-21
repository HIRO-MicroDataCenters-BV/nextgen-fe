import { h } from "vue";
import type { VNode } from "vue";

/**
 * Creates a column header with an optional icon
 * @param text - The header text to display
 * @param icon - Optional lucide icon name (e.g., "lucide:user", "lucide:calendar")
 * @param iconOnly - If true, only shows the icon without text
 * @returns VNode with icon and text, icon only, or just text
 */
export function createColumnHeader(
    text: string,
    icon?: string,
    iconOnly = false
): VNode | string {
    if (!icon) {
        return text;
    }

    // Icon-only mode (for actions column) - centered
    if (iconOnly) {
        return h(
            "div",
            { class: "flex items-center justify-center w-full" },
            [
                h(resolveComponent("Icon"), {
                    name: icon,
                    class: "h-4 w-4 text-gray-500",
                }),
            ]
        );
    }

    // Create a div container with flex layout
    // Icon + text mode
    return h(
        "div",
        {
            class: "flex items-center gap-2 text-gray-500",
        },
        [
            // Icon component
            h(resolveComponent("Icon"), {
                name: icon,
                class: "h-4 w-4",
            }),
            // Text
            h("span", text),
        ]
    );
}
