import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import LoginScreen from "../screens/Auth/LoginScreen";
import SignUp1Screen from "../screens/Auth/SignUp1Screen";
import SignUp2Screen from "../screens/Auth/SignUp2Screen";
import SignUp3Screen from "../screens/Auth/SignUp3Screen";
import SignUp4Screen from "../screens/Auth/SignUp4Screen";
import FindIdScreen from "../screens/Auth/FindIdScreen";
import FindPasswordScreen from "../screens/Auth/FindPasswordScreen";
import ResetPasswordScreen from "../screens/Auth/ResetPasswordScreen";
import SplashScreen from "../screens/Auth/SplashScreen";
import MainTab from "./MainTab";
import StockTradeScreen from "../screens/Main/StockTradeScreen";
import GuideLevel1 from "../screens/Guide/GuideLevel1";
import GuideLevel2 from "../screens/Guide/GuideLevel2";
import GuideLevel3 from "../screens/Guide/GuideLevel3";
import StudyScreen from "../screens/Guide/StudyScreen";

import SearchScreen from "../screens/Main/SearchScreen";
import StockDetail from "../screens/Main/StockDetail";

import TypeExamScreen from "../screens/Guide/TypeExamScreen";
import TypeResultScreen from "../screens/Guide/TypeResultScreen";

import TradingBuyScreen from "../screens/Main/TradingBuyScreen";
import TradingSellScreen from "../screens/Main/TradingSellScreen";
import EditUserInfoScreen from "../screens/MyPage/EditUserInfoScreen";
import NoticeScreen from "../screens/MyPage/NoticeScreen";
import FAQScreen from "../screens/MyPage/FAQScreen";

import AssetDetailScreen from "../screens/Main/AssetDetailScreen";

const Stack = createStackNavigator();

export default function StackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp1" component={SignUp1Screen} />
      <Stack.Screen name="SignUp2" component={SignUp2Screen} />
      <Stack.Screen name="SignUp3" component={SignUp3Screen} />
      <Stack.Screen name="SignUp4" component={SignUp4Screen} />

      <Stack.Screen name="FindId" component={FindIdScreen} />
      <Stack.Screen name="FindPassword" component={FindPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="MainTab" component={MainTab} />
      <Stack.Screen name="StockTrade" component={StockTradeScreen} />

      <Stack.Screen
        name="AssetDetail"
        component={AssetDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="GuideLevel1" component={GuideLevel1} />
      <Stack.Screen name="GuideLevel2" component={GuideLevel2} />
      <Stack.Screen name="GuideLevel3" component={GuideLevel3} />
      <Stack.Screen name="StudyScreen" component={StudyScreen} />

      <Stack.Screen name="TypeExam" component={TypeExamScreen} />
      <Stack.Screen name="TypeResult" component={TypeResultScreen} />

      <Stack.Screen name="TradingBuy" component={TradingBuyScreen} />
      <Stack.Screen name="TradingSell" component={TradingSellScreen} />
      <Stack.Screen name="EditUserInfo" component={EditUserInfoScreen} />
      <Stack.Screen name="Notice" component={NoticeScreen} />
      <Stack.Screen name="FAQ" component={FAQScreen} />
      <Stack.Screen name="SearchScreen" component={SearchScreen} />
      <Stack.Screen name="StockDetail" component={StockDetail} />
    </Stack.Navigator>
  );
}
