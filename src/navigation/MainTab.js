import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MainScreen from '../screens/Main/MainScreen';
import GuideScreen from '../screens/Guide/GuideScreen';
import ChatbotScreen from '../screens/Chatbot/ChatbotScreen';
import MyPageScreen from '../screens/MyPage/MyPageScreen';

// SVG imports
import HomeIcon from '../assets/icons/home.svg';
import HomeSelectedIcon from '../assets/icons/home-selected.svg';
import ChatbotIcon from '../assets/icons/chatbot.svg';
import ChatbotSelectedIcon from '../assets/icons/chatbot-selected.svg';
import MyPageIcon from '../assets/icons/mypage.svg';
import MyPageSelectedIcon from '../assets/icons/mypage-selected.svg';
import GuideIcon from '../assets/icons/guide.svg';
import GuideSelectedIcon from '../assets/icons/guide-selected.svg';

const Tab = createBottomTabNavigator();

const MainTab = () => {
  console.log('MainTab 나타났음');
  const insets = useSafeAreaInsets();
  
  // 안드로이드와 iOS에서 다른 높이 계산
  const getTabBarHeight = () => {
    const baseHeight = 60; // 기본 탭 높이
    const paddingBottom = Platform.OS === 'android' ? 
      Math.max(insets.bottom, 15) : // 안드로이드: safe area 또는 최소 15
      insets.bottom + 15; // iOS: safe area + 추가 여백
    
    return baseHeight + paddingBottom;
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#003340',
          borderTopColor: 'transparent',
          height: getTabBarHeight(),
          paddingBottom: Platform.OS === 'android' ? 
            Math.max(insets.bottom, 15) : 
            insets.bottom + 15,
          paddingTop: 16,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          shadowOpacity: 0, // iOS 그림자 제거
        },
        tabBarIcon: ({ focused }) => {
          console.log(`Tab pressed: ${route.name}, focused: ${focused}`);
          let Icon;
          if (route.name === 'Home') {
            Icon = focused ? HomeSelectedIcon : HomeIcon;
          } else if (route.name === 'Guide') {
            Icon = focused ? GuideSelectedIcon : GuideIcon;
          } else if (route.name === 'Chatbot') {
            Icon = focused ? ChatbotSelectedIcon : ChatbotIcon;
          } else {
            Icon = focused ? MyPageSelectedIcon : MyPageIcon;
          }
          return <Icon width={50} height={50} />; 
        },
        tabBarShowLabel: false,
      })}>
      <Tab.Screen
        name="Home"
        component={MainScreen}
        listeners={{
          tabPress: e => {
            console.log('Home tab pressed');
          },
        }}
      />
      <Tab.Screen
        name="Guide"
        component={GuideScreen}
        listeners={{
          tabPress: e => {
            console.log('Guide tab pressed');
          },
        }}
      />
      <Tab.Screen
        name="Chatbot"
        component={ChatbotScreen}
        listeners={{
          tabPress: e => {
            console.log('Chatbot tab pressed');
          },
        }}
      />
      <Tab.Screen
        name="MyPage"
        component={MyPageScreen}
        listeners={{
          tabPress: e => {
            console.log('MyPage tab pressed');
          },
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTab;