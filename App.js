import 'react-native-gesture-handler';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar, Platform } from 'react-native';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import StackNavigator from './src/navigation/StackNavigator';
import { setupNotificationListeners } from './src/services/PushNotificationService';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const navigationRef = useRef();
  const cleanupRef = useRef();
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // 폰트 로딩
        await Font.loadAsync({
          'Pretendard-Regular': require('./src/assets/fonts/Pretendard-Regular.otf'),
          'Pretendard-Medium': require('./src/assets/fonts/Pretendard-Medium.otf'),
          'Pretendard-SemiBold': require('./src/assets/fonts/Pretendard-SemiBold.otf'),
          'Pretendard-Bold': require('./src/assets/fonts/Pretendard-Bold.otf'),
          'Pretendard-Thin': require('./src/assets/fonts/Pretendard-Thin.otf'),
          
        });

        console.log('폰트 로딩 완료');
      } catch (e) {
        console.warn('폰트 로딩 실패:', e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    const initializeNotifications = () => {
      if (navigationRef.current) {
        console.log('expo 푸시알림 리스너 초기화');
        const cleanup = setupNotificationListeners(navigationRef.current);
        cleanupRef.current = cleanup;
        return cleanup;
      }
    };

    const timer = setTimeout(initializeNotifications, 1000);

    return () => {
      clearTimeout(timer);
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#003340" 
        translucent={false}
      />
      <NavigationContainer ref={navigationRef}>
        <StackNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}