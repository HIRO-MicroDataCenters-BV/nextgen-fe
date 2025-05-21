import { toast } from 'vue-sonner';

export const useToaster = () => {
  const nuxtApp = useNuxtApp();

  return {
    show: (
      type: string,
      message: string,
      data?: Record<string, string | number>,
    ) => {
      const msg = nuxtApp.$i18n.t(`message.${type}.${message}`);
      toast(
        msg,
        data || {
          duration: 2000,
        },
      );
    },
  };
};
