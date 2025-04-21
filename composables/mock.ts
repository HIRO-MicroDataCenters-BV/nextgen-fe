export const useMock = () => {
  const { t } = useI18n();

  return useState("mock", () => {
    return {
      data: [
        {
          id: 1,
          name: "Alice",
          description: "Alice is a software engineer",
          status: "active",
          type: "stream",
          biobank: "stream",
          last_update: "2021-09-01",
        },
        {
          id: 2,
          name: "Bob",
          description: "Bob is a data scientist",
          status: "inactive",
          type: "file",
          biobank: "file",
          last_update: "2021-09-02",
        },
        {
          id: 3,
          name: "Charlie",
          description: "Charlie is a machine learning engineer",
          status: "active",
          type: "database",
          biobank: "database",
          last_update: "2021-09-03",
        },
        {
          id: 4,
          name: "David",
          description: "David is a data engineer",
          status: "inactive",
          type: "stream",
          biobank: "stream",
          last_update: "2021-09-04",
        },
        {
          id: 5,
          name: "Eve",
          description: "Eve is a data analyst",
          status: "active",
          type: "file",
          biobank: "file",
          last_update: "2021-09-05",
        },
      ],
    };
  });
};
