import { toast } from "vue-sonner";

export const useToaster = () => {
  return {
    show: (
      type: string,
      message: string,
      data?: Record<string, string | number>
    ) => {
      const options = {
        ...(data || {}),
      };
      if (type === "error") {
        toast.error(message, { ...options });
      } else {
        toast.info(message, { ...options });
      }
    },
  };
};
