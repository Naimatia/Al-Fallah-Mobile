import { Stack } from "expo-router";
import "../global.css";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import * as Sentry from "@sentry/react-native";
import { StripeProvider } from "@stripe/stripe-react-native";
import Constants from "expo-constants";  // ✅ ADD THIS

// 🔹 PLACE THE KEYS HERE, RIGHT AFTER IMPORTS
const clerkPublishableKey =
  Constants.expoConfig?.extra?.clerkPublishableKey;

const stripePublishableKey =
  Constants.expoConfig?.extra?.stripePublishableKey;

if (!clerkPublishableKey) {
  throw new Error("Missing Clerk publishable key");
}

if (!stripePublishableKey) {
  throw new Error("Missing Stripe publishable key");
}

// Your Sentry setup
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
        tags: { type: "react-query-error", queryKey: query.queryKey[0]?.toString() || "unknon" },
        extra: { errorMessage: error.message, statusCode: error.response?.status, queryKey: query.queryKey },
      });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error: any) => {
      Sentry.captureException(error, {
        tags: { type: "react-query-mutation-error" },
        extra: { errorMessage: error.message, statusCode: error.response?.status },
      });
    },
  }),
});

// 🔹 USE THE KEYS IN PROVIDERS
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
/*import { Stack } from "expo-router";
import "../global.css";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import * as Sentry from "@sentry/react-native";
import { StripeProvider } from "@stripe/stripe-react-native";

Sentry.init({
  dsn: "https://fb6731b90610cc08333e6c16ffac5724@o4509813037137920.ingest.de.sentry.io/4510451611205712",

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 1.0,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: any, query) => {
      Sentry.captureException(error, {
        tags: {
          type: "react-query-error",
          queryKey: query.queryKey[0]?.toString() || "unknon",
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
      // global error handler for all mutations
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
    <ClerkProvider tokenCache={tokenCache}>
      <QueryClientProvider client={queryClient}>
        <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}>
          <Stack screenOptions={{ headerShown: false }} />
        </StripeProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
});
*/

