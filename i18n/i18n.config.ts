export default defineI18nConfig(() => {
  return {
    legacy: false,
    locale: "en",
    messages: {
      en: {
        app: {
          title: "NextGen UI",
          description:
            "NextGen UI is a modern and innovative platform for managing your projects and resources",
        },
        title: {
          marketplace: "Marketplace",
          my_catalog: "My Catalog",
          settings: "Settings",
          home: "Login",
        },
        welcome: "Welcome11",
        nextgen: "NextGen",
        general: {
          project_name: "NextGen UI",
        },
        subtitle: {
          marketplace: "Decentralised search across all institutional catalogs",
          data_products: "Data Products",
        },
        menu: {
          home: "Home",
          marketplace: "Marketplace",
          my_catalog: "My Catalog",
          settings: "Settings",
          help: "Help",
          logout: "Logout",
        },
        sidebar: {
          home: "Home",
          marketplace: "Marketplace",
        },
        column: {
          name: "Name",
          biobank: "Biobank",
          description: "Description",
          lastupdate: "Last Update",
        },
        label: {
          filters: "Filters",
        },
        action: {
          add_dataset: "Add Dataset",
          previous: "Previous",
          next: "Next",
        },
        placeholder: {
          search: "Search...",
          select_filter: "Select filter",
        },
        hint: {
          in: "In",
          all: "All",
          no_results: "No results found",
          of: "of",
          rows_selected: "row(s) selected",
          page: "Page",
          showing: "Showing",
          to: "to",
          data_products: "data products",
          out_of: "out of",
        },
        pages: {
          login: {
            description: "Welcome to NextGen UI",
            login_title: "Login Page",
            login_subtitle: "Enter your data to login",
            email: "Email",
            email_placeholder: "Enter your email",
            password: "Password",
            password_placeholder: "Enter your password",
            remember_me: "Remember me",
            forgot_password: "Forgot password?",
            login_button: "Login",
            welcome_message: "Welcome to NextGen UI",
            welcome_description:
              "NextGen UI is a modern and innovative platform for managing your projects and resources",
          },
        },
      },
    },
  };
});
