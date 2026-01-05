import { useAuth } from "@clerk/clerk-expo";
import axios from "axios";
import { useEffect } from "react";

const API_URL = "https://expo-ecommerce-farmer.vercel.app/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const useApi = () => {
  const { getToken, isSignedIn, userId } = useAuth();

  useEffect(() => {
    console.log("🔐 [useApi] Hook mounted");
    console.log("isSignedIn:", isSignedIn);
    console.log("userId:", userId);

    const interceptor = api.interceptors.request.use(async (config) => {
      console.log("📤 [API Request] About to send:", config.method?.toUpperCase(), config.url);

      try {
        const token = await getToken();
        console.log("🔑 [Token] getToken() returned:", token ? "Valid token (length: " + token.length + ")" : "null/undefined");

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log("✅ [Token] Added Authorization header");
        } else {
          console.log("⚠️ [Token] No token — request will go without auth header");
        }
      } catch (error) {
        console.error("❌ [Token] Error getting token:", error);
      }

      return config;
    });

    // Cleanup
    return () => {
      console.log("🧹 [useApi] Cleaning up interceptor");
      api.interceptors.request.eject(interceptor);
    };
  }, [getToken, isSignedIn, userId]);

  return api;
};

// Optional: Add response logging too (very useful!)
api.interceptors.response.use(
  (response) => {
    console.log("📥 [API Response] Success:", response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error("📥 [API Response] Error:", error.response?.status, error.response?.config?.url);
    console.error("Error data:", error.response?.data);
    return Promise.reject(error);
  }
);

export default api;