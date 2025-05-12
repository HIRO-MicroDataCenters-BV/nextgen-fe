interface Page {
  section?: string;
  title?: string;
  subtitle?: string;
}

export const useApp = () => {
  const page = useState('page', () => {
    return {
      section: '',
      title: '',
      subtitle: '',
    };
  });
  const setPage = (value: Page) => {
    page.value = {
      section: value.section || '',
      title: value.title || '',
      subtitle: value.subtitle || '',
    };
  };
  return {
    page,
    setPage,
  };
};
