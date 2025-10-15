// /src/screens/MyPage/MyPageScreen.js
import React, { useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Feather";
import { API_BASE_URL } from "../../utils/apiConfig";

import { getNewAccessToken, clearTokens } from "../../utils/token";
import { fetchUserInfo } from "../../utils/user";
import { fetchUserMbtiType, getMbtiImage } from "../../utils/mbtiType";
import { increaseBalance } from "../../utils/point";
import { unregisterPushToken } from "../../services/PushNotificationService";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const isTablet = SCREEN_WIDTH >= 768;

const MyPageScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  console.log("🔌 MyPageScreen 렌더링");

  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [equippedBadges, setEquippedBadges] = useState(["🔥", "🌟", "💯"]);
  const [isEditingIntro, setIsEditingIntro] = useState(false);
  const [mbtiType, setMbtiType] = useState(null);
  const [mbtiAlias, setMbtiAlias] = useState(null);
  const [aliasLoading, setAliasLoading] = useState(false);

  const DEPOSIT_AMOUNT = 100000;

  useEffect(() => {
    fetchUserMbtiType(navigation, setMbtiType);
  }, []);

  // MBTI 추천 정보 가져오기 (별명 가져올라구)
  const fetchMbtiRecommendations = async () => {
    try {
      setAliasLoading(true);
      console.log("🎯 MBTI 추천 정보 요청 시작");

      const accessToken = await getNewAccessToken(navigation);
      if (!accessToken) {
        console.warn("⚠️ 액세스 토큰이 없음");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}mbti/result/recommendations/`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("📡 MBTI 추천 API 응답 상태:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ MBTI 추천 데이터:", data);

        if (data.alias) {
          setMbtiAlias(data.alias);
          console.log("🎭 별명 설정 완료:", data.alias);
        } else {
          console.warn("⚠️ 응답에 alias가 없음");
        }
      } else {
        const errorText = await response.text();
        console.warn(
          "❌ MBTI 추천 정보 가져오기 실패:",
          response.status,
          errorText
        );
      }
    } catch (error) {
  console.log("ℹ️ MBTI 추천 정보 가져오기 완료:", error.message || error);
} finally {
      setAliasLoading(false);
    }
  };

  // 생년월일 포맷팅
  const formatBirthdate = (birthdate) => {
    if (!birthdate) return "";
    const date = new Date(birthdate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}.${month}.${day}`;
  };

  // 이메일 마스킹
  const maskEmail = (email) => {
    if (!email) return "";
    const [localPart, domain] = email.split("@");
    if (localPart.length <= 2) return email;
    const maskedLocal =
      localPart.substring(0, 2) + "*".repeat(localPart.length - 2);
    return `${maskedLocal}@${domain}`;
  };

  // 생일까지 D-day 계산
  const calculateBirthdayDday = (birthdate) => {
    if (!birthdate) return "";

    const today = new Date();
    const birth = new Date(birthdate);

    const thisYearBirthday = new Date(
      today.getFullYear(),
      birth.getMonth(),
      birth.getDate()
    );

    // 올해 생일이 지났으면 내년 생일로
    if (thisYearBirthday < today) {
      thisYearBirthday.setFullYear(today.getFullYear() + 1);
    }
    const diffTime = thisYearBirthday - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "🎉 생일 축하드려요!";
    if (diffDays === 1) return "🎂 D-1";
    return `🎂 D-${diffDays}`;
  };

  const MenuButton = ({ label, onPress, iconColor = "#ffffff" }) => (
    <TouchableOpacity style={styles.menuButton} onPress={onPress}>
      <View style={styles.menuRow}>
        <Text style={styles.menuText}>{label}</Text>
        <Icon name="chevron-right" size={isTablet ? 24 : 20} color={iconColor} />
      </View>
    </TouchableOpacity>
  );

  const handleLogout = async () => {
    try {
      console.log("📱 Push Token 해제 시작");
      try {
        const pushUnregisterSuccess = await unregisterPushToken(navigation);
        if (pushUnregisterSuccess) {
          console.log("✅ Push Token 해제 성공");
        } else {
          console.warn("⚠️ Push Token 해제 실패 (계속 진행)");
        }
      } catch (pushError) {
  console.log("ℹ️ Push Token 해제 건너뜀:", pushError.message || pushError);
}

      try {
        const accessToken = await getNewAccessToken(navigation);
        if (accessToken) {
          const response = await fetch(`${API_BASE_URL}logout/`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            console.log("✅ 서버 로그아웃 성공");
          } else {
            console.warn("⚠️ 서버 로그아웃 실패:", response.status);
          }
        }
      } catch (serverError) {
        console.warn("⚠️ 서버 로그아웃 요청 중 오류:", serverError);
      }

      await Promise.all([
        clearTokens(),
        AsyncStorage.removeItem("userEmail"),
        AsyncStorage.removeItem("userPassword"),
        AsyncStorage.removeItem("deviceId"),
        AsyncStorage.removeItem("pushToken"),
      ]);

      console.log("✅ 로컬 데이터 정리 완료");

      Alert.alert("로그아웃", "정상적으로 로그아웃되었습니다.", [
        {
          text: "확인",
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          },
        },
      ]);
    } catch (err) {
      console.error("❌ 로그아웃 중 오류:", err);

      try {
        await Promise.all([
          clearTokens(),
          AsyncStorage.removeItem("userEmail"),
          AsyncStorage.removeItem("userPassword"),
          AsyncStorage.removeItem("deviceId"),
          AsyncStorage.removeItem("pushToken"),
        ]);
      } catch (cleanupError) {
        console.error("❌ 로컬 데이터 정리 중 오류:", cleanupError);
      }

      Alert.alert("로그아웃", "로그아웃되었습니다.", [
        {
          text: "확인",
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          },
        },
      ]);
    }
  };

const handleDeleteAccount = () => {
  Alert.alert(
    "회원 탈퇴",
    "정말 탈퇴하시겠습니까?\n이 작업은 되돌릴 수 없습니다.",
    [
      { text: "취소", style: "cancel" },
      {
        text: "탈퇴하기",
        style: "destructive",
        onPress: async () => {
          try {
            console.log("🔱 회원 탈퇴 - Push Token 해제 시작");
            
            // Push Token 해제를 조용하게 처리
            try {
              await unregisterPushToken(navigation);
              console.log("✅ 탈퇴 시 Push Token 해제 성공");
            } catch (pushError) {
              console.log("ℹ️ 탈퇴 시 Push Token 해제 건너뜀:", pushError.message || "알 수 없는 오류");
            }

            const accessToken = await getNewAccessToken(navigation);
            if (!accessToken) {
              Alert.alert(
                "인증 오류",
                "토큰이 만료되었습니다. 다시 로그인해주세요."
              );
              navigation.navigate("Login");
              return;
            }

            const response = await fetch(`${API_BASE_URL}users/delete/`, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
            });

            if (response.ok) {
              await Promise.all([
                clearTokens(),
                AsyncStorage.removeItem("userEmail"),
                AsyncStorage.removeItem("userPassword"),
                AsyncStorage.removeItem("deviceId"),
                AsyncStorage.removeItem("pushToken"),
              ]);

              Alert.alert("탈퇴 완료", "계정이 삭제되었습니다.");
              navigation.navigate("Login");
            } else {
              const text = await response.text();
              console.error("회원 탈퇴 실패 응답:", text);
              Alert.alert("오류", "회원 탈퇴에 실패했습니다.");
            }
          } catch (err) {
            console.error("회원 탈퇴 중 오류:", err);
            Alert.alert("오류", "네트워크 오류로 탈퇴에 실패했습니다.");
          }
        },
      },
    ]
  );
};

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const accessToken = await getNewAccessToken(navigation);
        if (!accessToken) {
          console.error("❌ 액세스 토큰 없음, 로그인으로 이동");
          Alert.alert("인증 만료", "다시 로그인해주세요.");
          navigation.navigate("Login");
          return;
        }

        // 사용자 정보와 MBTI 추천 정보를 병렬로 로드
        await Promise.all([
          fetchUserInfo(navigation, setUserInfo),
          fetchMbtiRecommendations(),
        ]);
      } catch (err) {
        console.error("❌ 사용자 정보 불러오기 실패:", err);
        Alert.alert("오류", "사용자 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchMbtiRecommendations();
    });

    return unsubscribe;
  }, [navigation]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#F074BA" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ✅ 화면 전체 스크롤 */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          // 하단 여유: 기기 안전영역 + 여분(80px)
          { paddingBottom: (insets?.bottom || 0) + (isTablet ? 100 : 80) },
        ]}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 프로필 섹션 */}
        <View style={styles.profileSection}>
          <View style={styles.profileCard}>
            {/* 프로필 이미지 */}
            <View style={styles.profileImageContainer}>
              <Image
                source={
                  mbtiType && getMbtiImage(mbtiType)
                    ? getMbtiImage(mbtiType)
                    : require("../../assets/profile.png")
                }
                style={styles.profileImage}
              />
              <View style={styles.profileImageShadow} />
            </View>

            {/* 유저 정보 */}
            <View style={styles.userInfoContainer}>
              <Text style={styles.userName}>
                {userInfo?.nickname || "잔고가 두둑한 햄스터"}
              </Text>

              {/* MBTI 별명 */}
              {aliasLoading ? (
                <View style={styles.aliasLoadingContainer}>
                  <ActivityIndicator size="small" color="#A8E6CF" />
                  <Text style={styles.aliasLoadingText}></Text>
                </View>
              ) : mbtiAlias ? (
                <Text style={styles.mbtiAlias}>"{mbtiAlias}"</Text>
              ) : (
                <Text style={styles.mbtiAliasEmpty}>별명을 불러오는 중...</Text>
              )}

              <View style={styles.userDetailsContainer}>
                {userInfo?.email && (
                  <View style={styles.userDetailRow}>
                    <Icon
                      name="mail"
                      size={isTablet ? 16 : 14}
                      color="#B8C5D1"
                      style={styles.detailIcon}
                    />
                    <Text style={styles.userDetailText}>
                      {userInfo.email /* 마스킹은 필요 시 maskEmail 사용 */}
                    </Text>
                  </View>
                )}

                {userInfo?.birthdate && (
                  <View style={styles.userDetailRow}>
                    <Icon
                      name="calendar"
                      size={isTablet ? 16 : 14}
                      color="#B8C5D1"
                      style={styles.detailIcon}
                    />
                    <Text style={styles.userDetailText}>
                      {formatBirthdate(userInfo.birthdate)}
                    </Text>
                    <Text style={styles.birthdayDday}>
                      {calculateBirthdayDday(userInfo.birthdate)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* 돌림판 섹션 */}
        <View style={styles.rouletteSection}>
          <Text style={styles.moneyTitle}>📢 진행 중인 이벤트</Text>
          <TouchableOpacity
            style={styles.rouletteButton}
            onPress={() => navigation.navigate("Roulette")}
          >
            <View style={styles.rouletteButtonContent}>
              <Text style={styles.rouletteButtonText}>일일 룰렛 돌리기</Text>
              <Icon name="arrow-right" size={isTablet ? 24 : 20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* 메뉴 섹션 (내부 스크롤 ❌) */}
        <View style={styles.menuSectionContainer}>
          <View style={styles.menuContainer}>
            <MenuButton
              label="공지사항"
              onPress={() => navigation.navigate("Notice")}
              iconColor="#6EE69E"
            />
            <MenuButton
              label="자주 묻는 질문(FAQ)"
              onPress={() => navigation.navigate("FAQ")}
              iconColor="#6EE69E"
            />
            <MenuButton
              label="비밀번호 변경"
              onPress={() => navigation.navigate("ChangePassword")}
              iconColor="#6EE69E"
            />
            <MenuButton
              label="로그아웃"
              onPress={handleLogout}
              iconColor="#6EE69E"
            />
            <MenuButton
              label="회원 탈퇴"
              onPress={handleDeleteAccount}
              iconColor="#9aa19dff"
            />
          </View>
        </View>
       <View style={{ height: (insets?.bottom || 0) + (isTablet ? 20 : 16) }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#003340",
    paddingHorizontal: isTablet ? 30 : 20,
    paddingTop: isTablet ? 60 : 50,
  },

  // 전체 스크롤 뷰
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: isTablet ? 30 : 24,
  },

  // 프로필 섹션
  profileSection: {
    marginTop: isTablet ? 25 : 20,
    marginBottom: isTablet ? 12 : 10,
  },
  profileCard: {
    backgroundColor: "rgba(255, 255, 255, 0.09)",
    borderRadius: isTablet ? 24 : 20,
    padding: isTablet ? 30 : 25,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  profileImageContainer: { 
    position: "relative", 
    marginRight: isTablet ? 25 : 20 
  },
  profileImage: {
    width: isTablet ? 115 : 95,
    height: isTablet ? 115 : 95,
    borderRadius: isTablet ? 58 : 50,
    backgroundColor: "rgba(212, 221, 239, 0.2)",
  },
  profileImageShadow: {
    position: "absolute",
    top: 0,
    left: 0,
    width: isTablet ? 115 : 95,
    height: isTablet ? 115 : 95,
    borderRadius: isTablet ? 58 : 50,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(247, 206, 229, 0.3)",
  },
  userInfoContainer: { 
    flex: 1, 
    justifyContent: "center", 
    backgroundColor: "transparent" 
  },
  userName: {
    fontSize: isTablet ? 26 : 22,
    fontWeight: "700",
    color: "#FFD1EB",
    marginBottom: isTablet ? 6 : 4,
    marginTop: isTablet ? 6 : 5,
    letterSpacing: 0.5,
  },
  mbtiAlias: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: "400",
    color: "#dadadaff",
    marginBottom: isTablet ? 15 : 13,
    letterSpacing: 0.3,
  },
  mbtiAliasEmpty: {
    fontSize: isTablet ? 14 : 12,
    fontWeight: "400",
    color: "rgba(168, 230, 207, 0.5)",
    marginBottom: isTablet ? 15 : 13,
  },
  aliasLoadingContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: isTablet ? 10 : 8 
  },
  aliasLoadingText: { 
    fontSize: isTablet ? 14 : 12, 
    color: "#dadadaff", 
    marginLeft: isTablet ? 8 : 6, 
    fontStyle: "italic" 
  },
  userDetailsContainer: { gap: isTablet ? 8 : 6 },
  userDetailRow: { flexDirection: "row", alignItems: "center" },
  detailIcon: { 
    marginRight: isTablet ? 10 : 8, 
    width: isTablet ? 18 : 16 
  },
  userDetailText: {
    fontSize: isTablet ? 16 : 14,
    color: "#B8C5D1",
    fontWeight: "400",
    letterSpacing: 0.2,
  },
  birthdayDday: {
    fontSize: isTablet ? 14 : 12,
    color: "#fb9dd2ff",
    fontWeight: "600",
    marginLeft: isTablet ? 10 : 8,
    paddingHorizontal: isTablet ? 8 : 6,
    paddingVertical: isTablet ? 3 : 2,
    backgroundColor: "rgba(254, 212, 236, 0.1)",
    borderRadius: isTablet ? 10 : 8,
    overflow: "hidden",
  },

  // 구분선
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginVertical: isTablet ? 30 : 25,
  },

  // 돌림판 섹션
  rouletteSection: { marginBottom: isTablet ? 12 : 10 },
  moneyTitle: {
    color: "#c6d4e1ff",
    fontSize: isTablet ? 19 : 17,
    marginBottom: isTablet ? 18 : 15,
    fontWeight: "500",
    textAlign: "left",
    marginLeft: isTablet ? 6 : 4,
  },
  rouletteButton: {
    backgroundColor: "#F074BA",
    borderRadius: isTablet ? 20 : 16,
    paddingVertical: isTablet ? 22 : 18,
    paddingHorizontal: isTablet ? 24 : 20,
    shadowColor: "#F074BA",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  rouletteButtonContent: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center" 
  },
  rouletteButtonText: {
    color: "#FFFFFF",
    fontSize: isTablet ? 19 : 17,
    fontWeight: "600",
    marginRight: isTablet ? 12 : 10,
    letterSpacing: 0.3,
  },

  // 메뉴 섹션 (내부 스크롤 제거)
  menuSectionContainer: {
    marginTop: 0,
  },
  menuContainer: {
    paddingBottom: isTablet ? 12 : 10,
  },
  menuButton: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: isTablet ? 16 : 12,
    paddingVertical: isTablet ? 20 : 16,
    paddingHorizontal: isTablet ? 22 : 18,
    marginBottom: isTablet ? 12 : 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  menuRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center" 
  },
  menuText: { 
    fontSize: isTablet ? 19 : 17, 
    color: "#FFFFFF", 
    fontWeight: "500", 
    letterSpacing: 0.2 
  },
});

export default MyPageScreen;