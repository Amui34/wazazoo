import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || undefined,
  withCredentials: true,
});

export type ApiErrorBody = { error: string; message: string };

export function getApiErrorCode(err: unknown): string | undefined {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as ApiErrorBody | undefined)?.error;
  }
  return undefined;
}

export function getApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const body = err.response?.data as ApiErrorBody | undefined;
    if (body?.message) return body.message;
  }
  return "Une erreur est survenue. Réessaie.";
}
