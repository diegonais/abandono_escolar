import { apiClient } from "@/services/api/client";
import axios from "axios";
import { type AuthSession, type LoginPayload } from "@/types/auth";

interface LoginResponse {
  accessToken?: string;
  user?: {
    id?: string;
    fullName?: string;
    email?: string;
    role?: string;
  };
}

export async function login(payload: LoginPayload): Promise<AuthSession> {
  try {
    const { data } = await apiClient.post<LoginResponse>("/auth/login", payload);

    if (!data.accessToken) {
      throw new Error("No se recibio token de autenticacion.");
    }

    if (!data.user?.id || !data.user.fullName || !data.user.email || !data.user.role) {
      throw new Error("La respuesta del servidor no contiene los datos del usuario.");
    }

    return {
      token: data.accessToken,
      user: {
        id: data.user.id,
        fullName: data.user.fullName,
        email: data.user.email,
        role: data.user.role,
      },
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const apiMessage = error.response?.data?.message;
      if (typeof apiMessage === "string") {
        throw new Error(apiMessage);
      }

      if (Array.isArray(apiMessage) && apiMessage.length > 0 && typeof apiMessage[0] === "string") {
        throw new Error(apiMessage[0]);
      }
    }

    throw error;
  }
}
