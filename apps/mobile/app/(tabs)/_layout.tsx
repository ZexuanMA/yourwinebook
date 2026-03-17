import React from "react";
import { Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";

const WINE_RED = "#5B2E35";
const MUTED = "#6B6560";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: WINE_RED,
        tabBarInactiveTintColor: MUTED,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "探索",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: "square.grid.2x2", android: "grid_view", web: "grid_view" }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="stores"
        options={{
          title: "找店",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: "mappin.and.ellipse", android: "location_on", web: "location_on" }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "發帖",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: "plus.circle.fill", android: "add_circle", web: "add_circle" }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "我的",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: "person.crop.circle", android: "account_circle", web: "account_circle" }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
    </Tabs>
  );
}
