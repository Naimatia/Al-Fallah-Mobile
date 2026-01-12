import { Redirect, Stack } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { ActivityIndicator, View, Text } from "react-native"; // Optional: nicer loading UI

export default function AuthRoutesLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  // Always render SOMETHING while Clerk is loading auth state
  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 20 }}>Loading...</Text>
      </View>
    );
  }

  // After loading: if signed in → redirect to tabs
  if (isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  // Otherwise: show auth screens (login, signup, etc.)
  return <Stack screenOptions={{ headerShown: false }} />;
}