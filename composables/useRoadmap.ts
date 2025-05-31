export const useRoadmap = () => {
  const { t } = useI18n();
  const roadmapItems = ref([
    {
      id: 1,
      deadline: "2025-06-01",
      description: t("home.roadmap.item[0].description"),
    },
    {
      id: 2,
      deadline: "2025-06-01",
      description: t("home.roadmap.item[0].description"),
    },
    {
      id: 3,
      deadline: "2025-06-01",
      description: t("home.roadmap.item[0].description"),
    },
    {
      id: 4,
      deadline: "2025-06-01",
      description: t("home.roadmap.item[0].description"),
    },
    {
      id: 5,
      deadline: "2025-06-01",
      description: t("home.roadmap.item[0].description"),
    },
    {
      id: 6,
      deadline: "2025-06-01",
      description: t("home.roadmap.item[0].description"),
    },
  ]);
  return {
    roadmap: computed(() => roadmapItems.value),
  };
};
