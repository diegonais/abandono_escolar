import axios from "axios";

export function toApiError(error: unknown, fallbackMessage: string): Error {
  if (axios.isAxiosError(error)) {
    const responseMessage = error.response?.data?.message;

    if (typeof responseMessage === "string" && responseMessage.trim().length > 0) {
      return new Error(responseMessage);
    }

    if (
      Array.isArray(responseMessage) &&
      responseMessage.length > 0 &&
      typeof responseMessage[0] === "string"
    ) {
      return new Error(responseMessage[0]);
    }

    return new Error(fallbackMessage);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error(fallbackMessage);
}
