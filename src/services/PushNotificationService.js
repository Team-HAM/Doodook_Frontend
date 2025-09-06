import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { API_BASE_URL } from '../utils/apiConfig';
import { getNewAccessToken } from '../utils/token';


Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    console.log('📨 알림 수신:', notification.request.content.title);
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldPlayDefaultSound: true,
    };
  },
});

const generateDeviceId = () => {
  return 'android-' + Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// 채널은 단일채널로 통일함
const setupAndroidNotificationChannel = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: '두둑푸시알림',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: true,
      enableVibrate: true,
      showBadge: true,
      enableLights: true,
    });
    
    console.log('✅ 안드로이드 알림 채널 설정 완료');
  }
};

// 푸시 토큰 등록
export const registerPushToken = async (navigation) => {
  try {
    await setupAndroidNotificationChannel();
    
    // 디바이스인지 확인 (에뮬 or 폰)
    if (!Device.isDevice) {
      console.log('⚠️ 에뮬레이터에서는 푸시 알림이 제한될 수 있습니다.');
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('푸시 알림 권한 거부됨');
      return false;
    }

    // Expo Push Token 
    const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'd831fa11-69a9-40eb-a916-ae0d22291e92',  // 하드코딩 일단.
    });

    const pushToken = tokenData.data;
    console.log('💕Push Token 획득💕:'); 

    let deviceId = await AsyncStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = generateDeviceId();
      await AsyncStorage.setItem('deviceId', deviceId);
    }

    // 서버에 등록
    const success = await sendTokenToServer(pushToken, deviceId, navigation);
    
    if (success) {
      await AsyncStorage.setItem('pushToken', pushToken);
      console.log('💕푸시알림 토큰 서버 등록 완료💕');
      return true;
    } else {
      await AsyncStorage.setItem('pushToken', pushToken);
      console.warn('⚠️ 서버 등록 실패했지만 로컬에 저장 (임시 해결책)');
      return true;
    }
    
  } catch (error) {
    console.error('푸시알림 토큰 등록 실패:', error);

    return true;
  }
};

// 서버에 토큰 전송
const sendTokenToServer = async (token, deviceId, navigation) => {
  try {
    const accessToken = await getNewAccessToken(navigation);
    
    if (!accessToken) {
      console.error('❌ 액세스 토큰이 없습니다');
      return false;
    }

    console.log('📡 서버로 토큰 전송:', { // ⭐ 추가: 요청 로그
      token: token.substring(0, 20) + '...',
      deviceId,
      platform: 'android'
    });

    const response = await fetch(`${API_BASE_URL}api/push-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        token: token,
        deviceId: deviceId,
        platform: 'android'
      }),
    });

    console.log('📡 서버 응답 상태:', response.status);

    const contentType = response.headers.get('content-type');
    let responseData;

    if (contentType && contentType.includes('application/json')) {
      try {
        responseData = await response.json();
      } catch (jsonError) {
        console.error('❌ JSON 파싱 오류:', jsonError);
        return false;
      }
    } else {
      const textResponse = await response.text();
      console.error('❌ 서버에서 JSON이 아닌 응답:', textResponse.substring(0, 200));
      return false;
    }

    if (response.ok && responseData && responseData.ok) {
      console.log('✅ 토큰 서버 등록 성공:', responseData.created ? '신규' : '기존');
      return true;
    } else {
      console.error('❌ 서버 토큰 등록 실패:', responseData);
      return false;
    }
  } catch (error) {
    console.error('❌ 서버 토큰 전송 오류:', error);
    return false;
  }
};

// 푸시 토큰 해제
export const unregisterPushToken = async (navigation) => {
  try {
    const storedToken = await AsyncStorage.getItem('pushToken');
    
    if (!storedToken) {
      console.log('📱 등록된 푸시 토큰이 없습니다');
      return true;
    }

    const accessToken = await getNewAccessToken(navigation);
    
    if (!accessToken) {
      console.warn('⚠️ 액세스 토큰이 없어 서버 해제 생략, 로컬만 정리');
      await AsyncStorage.removeItem('pushToken');
      return true;
    }

    const response = await fetch(`${API_BASE_URL}api/push-tokens`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        token: storedToken,
      }),
    });

    if (response.ok) {
      await AsyncStorage.removeItem('pushToken');
      console.log('✅ 푸시알림 토큰 해제 완료');
      return true;
    } else {
      console.error('❌ 푸시알림 토큰 해제 실패:', response.status);
      await AsyncStorage.removeItem('pushToken');
      console.warn('⚠️ 서버 해제 실패했지만 로컬에서 제거');
      return true;
    }
  } catch (error) {
    console.error('❌ 푸시알림 토큰 해제 오류:', error);
    try {
      await AsyncStorage.removeItem('pushToken');
      console.warn('⚠️ 에러 발생했지만 로컬에서 제거');
    } catch (storageError) {
      console.error('❌ AsyncStorage 제거 실패:', storageError);
    }
    return true;
  }
};

// 알림 리스너 설정 (공지사항 알림 처리)
export const setupNotificationListeners = (navigation) => {
  // 앱이 실행 중일 때 알림 수신
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('📨 알림 수신 (포그라운드):', notification.request.content.title);
    
    const notificationData = notification.request.content.data;
    
    // 공지사항 알림인 경우
    if (notificationData?.type === 'notice') {
      console.log('📢 공지사항 알림 수신');
    }
  });

  // 알림 클릭 시 처리
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('👆 알림 클릭:', response.notification.request.content.title);
    
    const notificationData = response.notification.request.content.data;
    
    // 공지사항 알림 클릭 시 공지사항 화면으로
    if (notificationData?.type === 'notice') {
      console.log('📢 공지사항 화면으로 이동');
      navigation.navigate('NoticeScreen');
    } else if (notificationData?.screen) {
      navigation.navigate(notificationData.screen);
    }
  });

  // 클린업
  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
};