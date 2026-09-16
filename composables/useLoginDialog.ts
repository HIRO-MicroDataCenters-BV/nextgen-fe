/**
 * Shared open-state for the login modal. `AppGuestShell` hosts the single
 * `<AppLoginDialog>`, but any component rendered inside it (the top-bar button,
 * the landing hero CTA) can open it through this composable.
 */
export const useLoginDialog = () => {
  const open = useState("login-dialog-open", () => false);

  const openLogin = () => {
    open.value = true;
  };
  const closeLogin = () => {
    open.value = false;
  };

  return { open, openLogin, closeLogin };
};
