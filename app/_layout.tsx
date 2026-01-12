import * as WebBrowser from "expo-web-browser";
import { Stack } from "expo-router";
import "../global.css";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import * as Sentry from "@sentry/react-native";
import { StripeProvider } from "@stripe/stripe-react-native";

WebBrowser.maybeCompleteAuthSession(); // ✅ MUST be here (top-level)

// 🔹 Load environment variables
const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
const stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

// 🔹 Safety checks
if (!clerkPublishableKey) {
  throw new Error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY – check your .env file");
}

if (!stripePublishableKey) {
  throw new Error("Missing EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY – check your .env file");
}

// Sentry setup
Sentry.init({
  dsn: "https://fb6731b90610cc08333e6c16ffac5724@o4509813037137920.ingest.de.sentry.io/4510451611205712",
  sendDefaultPii: true,
  enableLogs: true,
  replaysSessionSampleRate: 1.0,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration()],
});

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: any, query) => {
      Sentry.captureException(error, {
        tags: {
          type: "react-query-error",
          queryKey: query.queryKey[0]?.toString() || "unknown",
        },
        extra: {
          errorMessage: error.message,
          statusCode: error.response?.status,
          queryKey: query.queryKey,
        },
      });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error: any) => {
      Sentry.captureException(error, {
        tags: { type: "react-query-mutation-error" },
        extra: {
          errorMessage: error.message,
          statusCode: error.response?.status,
        },
      });
    },
  }),
});

export default Sentry.wrap(function RootLayout() {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
      <QueryClientProvider client={queryClient}>
        <StripeProvider publishableKey={stripePublishableKey}>
          <Stack screenOptions={{ headerShown: false }} />
        </StripeProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
});
