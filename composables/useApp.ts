interface Page {
  section?: string;
  title?: string;
  subtitle?: string;
  source?: string;
}

export const useApp = () => {
  const page = useState("page", () => {
    return {
      section: "",
      title: "",
      subtitle: "",
      source: "",
    };
  });
  const setPage = (value: Page) => {
    page.value = {
      section: value.section || "",
      title: value.title || "",
      subtitle: value.subtitle || "",
      source: value.source || "",
    };
  };
  return {
    page,
    setPage,
  };
};
