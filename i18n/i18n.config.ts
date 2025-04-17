export default defineI18nConfig(() => {
  return {
    legacy: false,
    locale: "en",
    messages: {
      en: {
        welcome: "Welcome11",
        nextgen: "NextGen",
        general: {
          project_name: "NextGen UI",
        },
        title: {
          secondary_menu: "Secondary Menu",
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
        pages: {
          home: {
            title: "Home Page",
            description: "Welcome to NextGen UI",
            login_title: "Вход в систему",
            login_subtitle: "Введите свои данные для входа",
            email: "Email",
            email_placeholder: "Введите ваш email",
            password: "Пароль",
            password_placeholder: "Введите ваш пароль",
            remember_me: "Запомнить меня",
            forgot_password: "Забыли пароль?",
            login_button: "Войти",
            welcome_message: "Добро пожаловать в NextGen UI",
            welcome_description:
              "Инновационная платформа для управления вашими проектами и ресурсами",
          },
          marketplace: {
            title: "Marketplace",
            description: "Explore our marketplace",
          },
        },
      },
    },
  };
});
