// import 'react-native-gesture-handler';
// import React from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import StackNavigator from './src/navigation/StackNavigator';


// export default function App() {
//   return (
//     <NavigationContainer>
//       <StackNavigator />
//     </NavigationContainer>
//   );
// }

// App.js
import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import {
  NavigationContainer,
  createNavigationContainerRef,
} from '@react-navigation/native';
import StackNavigator from './src/navigation/StackNavigator';

// ⬇️ 방금 만든 헬퍼 (src/lib/notifications.js)
import {
  registerPushToken,
  attachNotificationListeners,
  detachNotificationListeners,
} from './src/lib/notifications';

// 알림 탭 시 네비게이션에 쓸 ref
export const navigationRef = createNavigationContainerRef();

export default function App() {
  useEffect(() => {
    let mounted = true;

    // 앱 시작 시 토큰 등록 (로그인 직후로 옮겨도 됨)
    (async () => {
      try {
        const t = await registerPushToken(/* userId 넣을 거면 숫자 */);
        if (mounted) console.log('device push token:', t);
      } catch (e) {
        console.warn(e);
      }
    })();

    // 알림 수신/탭 리스너
    attachNotificationListeners(
      (n) => {
        // 포그라운드 수신
        console.log('foreground notification:', n?.request?.content);
      },
      (r) => {
        // 알림 탭 시 딥링크/네비게이션
        const data = r?.notification?.request?.content?.data || {};
        console.log('notification tapped:', data);
        if (navigationRef.isReady() && data?.screen) {
          // 서버에서 data에 { screen: 'StockDetail', params: {...} } 식으로 넣어주면 이동 가능
          navigationRef.navigate(data.screen, data.params || {});
        }
      }
    );

    return () => {
      mounted = false;
      detachNotificationListeners();
    };
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <StackNavigator />
    </NavigationContainer>
  );
}

