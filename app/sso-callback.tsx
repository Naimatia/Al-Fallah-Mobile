import { Redirect } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { useEffect } from "react";
import { View } from "react-native";

export default function CallbackScreen() {
  const { isLoaded, isSignedIn } = useAuth();

  // Auto-redirect when signed in (no visible screen)
  if (isLoaded && isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  // Invisible full-screen cover (no flash, no message)
  return (
    <View 
      style={{ 
        flex: 1, 
        backgroundColor: "transparent" 
      }} 
      collapsable={true}
    />
  );
}