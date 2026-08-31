import { ref } from "vue";
import { type ToastItem } from "../enums/enums";
import { type ToastType } from "../enums/enums";

const toasts = ref<ToastItem[]>([]);

function useToast() {
  const addToast = (
    message: string,
    type: ToastType,
    duration: number = 4000,
  ) => {
    const id = crypto.randomUUID();

    const timerId = setTimeout(() => {
      removeToast(id);
    }, duration);

    toasts.value.push({ id, message, type, duration, timerId });

    if (toasts.value.length > 5) {
      removeToast(toasts.value[0].id);
    }
  };

  const removeToast = (id: string) => {
    const toast = toasts.value.find((t) => t.id === id);

    if (toast?.timerId) {
      clearTimeout(toast?.timerId);
    }

    toasts.value = toasts.value.filter((t) => t.id !== id);
  };

  // helper toast functions
  const successToast = (message: string, duration?: number) => {
    addToast(message, "success", duration);
  };

  const infoToast = (message: string, duration?: number) => {
    addToast(message, "info", duration);
  };

  const errorToast = (message: string, duration?: number) => {
    addToast(message, "error", duration);
  };

  return {
    toasts,
    removeToast,
    successToast,
    infoToast,
    errorToast,
  };
}

export { useToast };
