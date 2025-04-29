import { Tabs, Slot, useSegments, useRouter } from "expo-router";
import { CollectionProvider } from "../utils/collectionContext";
import { AuthProvider, useAuth } from "../utils/authContext";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { COLORS } from "../utils/theme";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";

// Auth navigation guard component
function AuthGuard({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isFirstRender, setIsFirstRender] = useState(true);

  useEffect(() => {
    // Skip navigation on first render to avoid the error
    if (isFirstRender) {
      setIsFirstRender(false);
      return;
    }

    const isAuthGroup = segments[0] === "(auth)";
    
    if (!isLoading) {
      if (!isAuthenticated && !isAuthGroup) {
        // Redirect to login if not authenticated and not already on an auth screen
        router.replace("/login");
      } else if (isAuthenticated && isAuthGroup) {
        // Redirect to home if authenticated and on an auth screen
        router.replace("/");
      }
    }
  }, [isAuthenticated, isLoading, segments, isFirstRender]);

  if (isLoading) {
    // Show loading indicator while checking auth state
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background.dark }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return children;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <CollectionProvider>
        <StatusBar style="light" />
        <AuthGuard>
          <Tabs
            screenOptions={{
              tabBarActiveTintColor: COLORS.primary,
              tabBarInactiveTintColor: COLORS.inactive,
              headerShown: true,
              headerStyle: {
                backgroundColor: COLORS.background.dark,
              },
              headerTintColor: COLORS.text.primary,
              headerTitleStyle: {
                fontWeight: 'bold',
              },
              tabBarStyle: {
                backgroundColor: COLORS.background.card,
                borderTopColor: COLORS.border,
              },
              tabBarLabelStyle: {
                fontWeight: '500',
              },
            }}
          >
            <Tabs.Screen
              name="about"
              options={{
                title: "About",
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="information-circle-outline" size={size} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="index"
              options={{
                title: "Home",
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="home-outline" size={size} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="collection"
              options={{
                title: "Collection",
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="albums-outline" size={size} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="profile"
              options={{
                title: "Profile",
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="person-outline" size={size} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="login"
              options={{
                href: null, // Hide from tab bar
              }}
            />
          </Tabs>
        </AuthGuard>
      </CollectionProvider>
    </AuthProvider>
  );
}
