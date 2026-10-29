import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import type { AuthUserProfile } from "./useAuthUser";
import { canIssueCredentials } from "./issuer/credentialIssuerClient";

export type UserProfile = AuthUserProfile;

export interface MenuItem {
  id: string;
  title: string;
  icon: string;
  url: string;
  items: MenuItem[];
  isActive?: boolean;
  key?: string;
}

export interface MenuStructure {
  main: MenuItem[];
  secondary: MenuItem[];
  /** Operator pages (sidebar group "Admin") */
  admin: MenuItem[];
  footer: MenuItem[];
}

export function useMenu() {
  const { t } = useI18n();
  const route = useRoute();
  const config = useRuntimeConfig();
  const { user: authUserDisplay, role } = useAuthUser();

  // App version
  const version = ref("v1.0.0");

  const catalogName = config.public.catalogName;

  // Menu structure
  const menuItems = ref<MenuStructure>({
    main: [
      {
        id: "home",
        title: t("menu.home"),
        icon: "lucide:home",
        url: "/home",
        items: [],
        isActive: route.path === "/",
      },
      {
        id: "tools",
        title: t("menu.tools"),
        icon: "lucide:blocks",
        url: "/tools",
        items: [],
        isActive: route.path === "/tools",
      },
    ],
    secondary: [
      {
        id: "marketplace",
        title: t("menu.marketplace"),
        icon: "lucide:store",
        url: "/marketplace",
        items: [],
        isActive: route.path === "/marketplace",
      },
      {
        id: "my_catalog",
        title: t(`menu.${catalogName}`),
        icon: "lucide:library-big",
        url: "/my_catalog",
        items: [],
        isActive: route.path === "/my_catalog",
      },
    ],
    admin: [
      {
        id: "credentials",
        title: t("menu.credentials"),
        icon: "lucide:badge-check",
        url: "/credentials",
        items: [],
        isActive: route.path === "/credentials",
      },
    ],
    footer: [],
  });

  // Update active state of menu items based on the current route
  const updateActiveState = () => {
    menuItems.value.main.forEach((item) => {
      if (item.url === "#" && item.items.length > 0) {
        item.isActive = item.items.some((subItem) =>
          route.path.startsWith(subItem.url)
        );
      } else {
        item.isActive = route.path === item.url;
      }
    });

    [...menuItems.value.secondary, ...menuItems.value.admin].forEach((item) => {
      if (item.url === "#" && item.items.length > 0) {
        item.isActive = item.items.some((subItem) =>
          route.path.startsWith(subItem.url)
        );
      } else {
        item.isActive = route.path === item.url;
      }
    });
  };

  // Exporting data and methods
  return {
    // Admin pages only for roles that may issue credentials (site_admin,
    // operator — role from the ds-login token).
    menu: computed(() => ({
      ...menuItems.value,
      admin: canIssueCredentials(role.value) ? menuItems.value.admin : [],
    })),
    user: authUserDisplay,
    version,
    updateActiveState,
  };
}
