"use client";

import { toast as sonnerToast } from "sonner";

export const showSuccess = (message: string) => {
  sonnerToast.success(message);
};

export const showError = (message: string) => {
  sonnerToast.error(message);
};

export const showInfo = (message: string) => {
  sonnerToast.info(message);
};

export const showWarning = (message: string) => {
  sonnerToast.warning(message);
};