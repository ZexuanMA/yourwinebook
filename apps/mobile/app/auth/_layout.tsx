import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#FAF8F5" },
        headerTintColor: "#5B2E35",
        headerShadowVisible: false,
        contentStyle: { backgroundColor: "#FAF8F5" },
      }}
    />
  );
}
