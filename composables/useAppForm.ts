interface Form {
  files?: unknown[];
}

export const useAppForm = () => {
  const appForm = useState("appForm", () => {
    return {
      files: [] as unknown[],
    };
  });
  const setAppForm = (value: Form) => {
    appForm.value = {
      files: value.files || ([] as unknown[]),
    };
  };
  return {
    appForm,
    setAppForm,
  };
};
