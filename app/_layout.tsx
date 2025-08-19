// app/_layout.tsx
import { Slot, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { getHasOnboarded, initDb } from "../src/db/settings";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      // 1) DB 준비
      await initDb();

      // 2) 온보딩 여부 확인
      const onboarded = await getHasOnboarded();

      const inAuth = segments[0] === "(auth)";
      if (!onboarded && !inAuth) {
        // 미온보딩이면 온보딩으로
        router.replace("/onboarding");
      } else if (onboarded && inAuth) {
        // 온보딩 끝났는데 (auth)에 있으면 홈으로
        router.replace("/");
      }

      setReady(true);
      SplashScreen.hideAsync().catch(() => {});
    })().catch((e) => {
      console.error("[RootLayout] init error:", e);
      setReady(true);
      SplashScreen.hideAsync().catch(() => {});
    });
  }, [segments, router]);

  if (!ready) return null; // 가드/스플래시 중

  return <Slot />; // 하위 레이아웃/페이지 렌더링
}
