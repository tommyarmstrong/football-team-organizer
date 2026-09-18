import { Toast } from "@base-ui/react/toast";

export const toastManager = Toast.createToastManager();

export function toastSuccess(message: string) {
  return toastManager.add({
    title: message,
    type: "success",
    timeout: 4000,
  });
}
