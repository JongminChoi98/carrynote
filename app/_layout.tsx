import { Slot, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { initClubs } from "../src/db/clubs";
import { getHasOnboarded, initDb } from "../src/db/settings";
import { initShots } from "../src/db/shots";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      // 1) DB 준비
      await initDb();
      await initClubs();
      await initShots();

      // 2) 온보딩 여부 확인
      const onboarded = await getHasOnboarded();
      const inAuth = segments[0] === "(auth)";

      if (!onboarded && !inAuth) {
        router.replace("/onboarding");
      } else if (onboarded && inAuth) {
        router.replace("/");
      }

      if (mounted) {
        setReady(true);
        SplashScreen.hideAsync().catch(() => {});
      }
    })().catch((e) => {
      console.error("[RootLayout] init error:", e);
      if (mounted) {
        setReady(true);
        SplashScreen.hideAsync().catch(() => {});
      }
    });
    return () => {
      mounted = false;
    };
  }, [segments, router]);

  if (!ready) return null; // 스플래시 숨기기 전까지 렌더 X

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
        <Slot />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
