import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";

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
  footer: MenuItem[];
}

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
}

export function useMenu() {
  const { t } = useI18n();
  const route = useRoute();

  // Версия приложения
  const version = ref("v1.0.0");

  // Пользовательский профиль
  const userProfile = ref<UserProfile>({
    name: "John Doe",
    email: "john.doe@example.com",
    avatar: "/images/logo.svg", // Временно используем логотип как аватар
  });

  // Структура меню
  const menuItems = ref<MenuStructure>({
    main: [
      {
        id: "home",
        title: t("menu.home"),
        icon: "lucide:home",
        url: "/",
        items: [],
        isActive: route.path === "/",
      },
    ],
    secondary: [
      {
        id: "marketplace",
        title: t("menu.marketplace"),
        icon: "lucide:shopping-bag",
        url: "/marketplace",
        items: [],
        isActive: route.path === "/marketplace",
      },
      {
        id: "my-catalog",
        title: t("menu.my_catalog"),
        icon: "lucide:folder",
        url: "/my-catalog",
        items: [],
        isActive: route.path === "/my-catalog",
      },
    ],
    footer: [],
  });

  // Обновление активного состояния при изменении маршрута
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

    menuItems.value.secondary.forEach((item) => {
      if (item.url === "#" && item.items.length > 0) {
        item.isActive = item.items.some((subItem) =>
          route.path.startsWith(subItem.url)
        );
      } else {
        item.isActive = route.path === item.url;
      }
    });
  };

  // Экспортируемые данные и методы
  return {
    menu: computed(() => menuItems.value),
    user: computed(() => userProfile.value),
    version,
    updateActiveState,
  };
}
