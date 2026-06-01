"use client";

import { toast as sonnerToast } from "sonner";

export const toast = {
  error(message: string) {
    return sonnerToast.error(message);
  },
  success(message: string) {
    return sonnerToast.success(message);
  },
  warning(message: string) {
    return sonnerToast.warning(message);
  },
  info(message: string) {
    return sonnerToast.info(message);
  },
};
