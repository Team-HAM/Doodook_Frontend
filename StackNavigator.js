import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
//import { NavigationContainer } from '@react-navigation/native';
import LoginScreen from './screens/LoginScreen';
import SignUp1Screen from './screens/SignUp1Screen';
import SignUp2Screen from './screens/SignUp2Screen';
import SignUp3Screen from './screens/SignUp3Screen';
import SignUp4Screen from './screens/SignUp4Screen';
import FindIdScreen from './screens/FindIdScreen';
import FindPasswordScreen from './screens/FindPasswordScreen';
import SplashScreen from './src/screens/SplashScreen';
import MainTab from './src/navigation/MainTab';
import StockTradeScreen from './src/screens/StockTradeScreen';

const Stack = createStackNavigator();

export default function StackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen}/>
      <Stack.Screen name="Login" component={LoginScreen}/>
      <Stack.Screen name="MainTab" component={MainTab}/>
      <Stack.Screen name="StockTrade" component={StockTradeScreen}/>
      <Stack.Screen name="SignUp1" component={SignUp1Screen}/>
      <Stack.Screen name="SignUp2" component={SignUp2Screen}/>
      <Stack.Screen name="SignUp3" component={SignUp3Screen}/>
      <Stack.Screen name="SignUp4" component={SignUp4Screen}/>
      <Stack.Screen name="FindId" component={FindIdScreen}/>
      <Stack.Screen name="FindPassword" component={FindPasswordScreen}/>
    </Stack.Navigator>
  );
}