import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Feather";
import { API_BASE_URL } from "../../utils/apiConfig";

import { getNewAccessToken, clearTokens } from "../../utils/token";
import { fetchUserInfo } from "../../utils/user";
import { fetchUserMbtiType, getMbtiImage } from "../../utils/mbtiType";
import { increaseBalance } from "../../utils/point";
import { unregisterPushToken } from "../../services/PushNotificationService";

const MyPageScreen = ({ navigation }) => {
  console.log("📌 MyPageScreen 렌더링");

  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [equippedBadges, setEquippedBadges] = useState(["🔥", "🌟", "💯"]);
  const [introText, setIntroText] = useState("티끌 모아 태산이긴해!");
  const [isEditingIntro, setIsEditingIntro] = useState(false);
  const [mbtiType, setMbtiType] = useState(null);

  const DEPOSIT_AMOUNT = 100000;

  useEffect(() => {
    fetchUserMbtiType(navigation, setMbtiType);
  }, []);

  const MenuButton = ({ label, onPress }) => (
    <TouchableOpacity style={styles.menuButton} onPress={onPress}>
      <View style={styles.menuRow}>
        <Text style={styles.menuText}>{label}</Text>
        <Icon name="chevron-right" size={20} color="#ffffff" />
      </View>
    </TouchableOpacity>
  );

  const handleLogout = async () => {
    try {

      console.log("📱 Push Token 해제 시작");
      try {
        const pushUnregisterSuccess = await unregisterPushToken(navigation); // ⭐ 수정: navigation 파라미터 추가
        if (pushUnregisterSuccess) {
          console.log("✅ Push Token 해제 성공");
        } else {
          console.warn("⚠️ Push Token 해제 실패 (계속 진행)");
        }
      } catch (pushError) {
        console.error("❌ Push Token 해제 중 오류:", pushError);
  
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
        clearTokens(), // 토큰 정리
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
              // ⭐ 추가: Push Token 해제 (회원 탈퇴 시)
              console.log("📱 회원 탈퇴 - Push Token 해제 시작");
              try {
                await unregisterPushToken(navigation); // ⭐ 수정: navigation 파라미터 추가
                console.log("✅ 탈퇴 시 Push Token 해제 성공");
              } catch (pushError) {
                console.error("❌ 탈퇴 시 Push Token 해제 오류:", pushError);
              }
              // ⭐ 추가 끝

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
                // ⭐ 추가: 로컬 데이터도 정리 (Push 관련 포함)
                await Promise.all([
                  clearTokens(),
                  AsyncStorage.removeItem("userEmail"),
                  AsyncStorage.removeItem("userPassword"),
                  AsyncStorage.removeItem("deviceId"), 
                  AsyncStorage.removeItem("pushToken"), 
                ]);
                // ⭐ 추가 끝

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

        await fetchUserInfo(navigation, setUserInfo);
      } catch (err) {
        console.error("❌ 사용자 정보 불러오기 실패:", err);
        Alert.alert("오류", "사용자 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#F074BA" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        {/* 왼쪽: 이미지 + 닉네임 */}
        <View style={styles.profileLeft}>
          <Image
            source={
              mbtiType && getMbtiImage(mbtiType)
                ? getMbtiImage(mbtiType)
                : require("../../assets/profile.png")
            }
            style={styles.profileImage}
          />
        </View>

        {/* 오른쪽: 뱃지 + 한줄소개 */}
        <View style={styles.profileRight}>
          <View style={styles.badgeRow}>
            {equippedBadges.map((badge, index) => (
              <View key={index} style={styles.badgeBox}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.userName}>
            {userInfo?.nickname || "잔고가 두둑한 햄스터"}
          </Text>

          <View style={styles.introRow}>
            <Icon
              name="edit-3"
              size={16}
              color="#ccc"
              style={{ marginRight: 6 }}
              onPress={() => setIsEditingIntro(true)}
            />
            {isEditingIntro ? (
              <TextInput
                value={introText}
                onChangeText={setIntroText}
                onSubmitEditing={() => setIsEditingIntro(false)}
                style={styles.introInput}
                autoFocus
              />
            ) : (
              <TouchableOpacity onPress={() => setIsEditingIntro(true)}>
                <Text style={styles.introText}>: {introText}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <View style={styles.divider} />
      <Text style={styles.moneyTitle}>🐹 돌려돌려 돌림판 🐹</Text>
      <View style={styles.moneyButtonContainer}>
        {/* <TouchableOpacity
          style={styles.tiggleButton}
          onPress={async () => {
            try {
              const message = await increaseBalance(navigation, DEPOSIT_AMOUNT);
              Alert.alert("출석 보상 받기", message);
            } catch (error) {
              Alert.alert("에러", error.message || "보상 받기에 실패했습니다.");
            }
          }}
        >
          <Text style={styles.moneyButtonText}>출석 보상 받기</Text>
        </TouchableOpacity> */}

        <TouchableOpacity
          style={styles.taesanButton}
          onPress={() => navigation.navigate("Roulette")}
        >
          <Text style={styles.moneyButtonText}>출석 보상 받으러 가기</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <ScrollView
        contentContainerStyle={styles.menuContainer}
        showsVerticalScrollIndicator={false}
      >
        <MenuButton
          label="회원정보 수정"
          onPress={() => navigation.navigate("EditUserInfo")}
        />
        <MenuButton
          label="공지사항"
          onPress={() => navigation.navigate("Notice")}
        />
        <MenuButton
          label="자주 묻는 질문(FAQ)"
          onPress={() => navigation.navigate("FAQ")}
        />
        <MenuButton
          label="비밀번호 변경"
          onPress={() => navigation.navigate("ChangePassword")}
        />
        <MenuButton label="로그아웃" onPress={handleLogout} />
        <MenuButton label="회원 탈퇴" onPress={handleDeleteAccount} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#003340",
    paddingHorizontal: 30,
    paddingTop: 60,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
    marginBottom: 0,
  },
  profileLeft: {
    alignItems: "center",
    marginLeft: 10,
    marginRight: 30,
  },
  profileRight: {
    flex: 1,
    justifyContent: "center",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#FFFFFFB0",
    backgroundColor: "#D4DDEF60",
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 0,
  },
  badgeBox: {
    backgroundColor: "#FFFFFF80",
    borderRadius: 50,
    paddingVertical: 6,
    paddingHorizontal: 6,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 15,
    color: "white",
    fontWeight: "bold",
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#F8C7CC",
    marginTop: 10,
    marginBottom: 5,
  },
  introRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 0,
    marginLeft: 0,
  },
  introText: {
    fontSize: 15,
    color: "#EEEEEE",
  },
  introInput: {
    fontSize: 14,
    color: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#888",
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "#4A5A60",
    marginVertical: 20,
  },
  moneyTitle: {
    color: "#EEEEEE",
    fontSize: 18,
    marginBottom: 20,
    marginLeft: 15,
    marginTop: 5,
    fontWeight: "600",
  },
  moneyButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  tiggleButton: {
    flex: 1,
    backgroundColor: "#5DB996E0",
    paddingVertical: 20,
    borderRadius: 20,
    marginHorizontal: 10,
    alignItems: "center",
  },
  taesanButton: {
    flex: 1,
    backgroundColor: "#F074BAE0",
    paddingVertical: 20,
    borderRadius: 20,
    marginHorizontal: 10,
    alignItems: "center",
  },
  moneyButtonText: {
    fontFamily: "Times New Roman",
    color: "#EFF1F5",
    fontSize: 18,
    fontWeight: "500",
  },
  menuContainer: {
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  menuRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  menuButton: {
    backgroundColor: "#D4DDEF30",
    padding: 15,
    borderRadius: 10,
    marginBottom: 13,
    marginHorizontal: 5,
  },
  menuText: {
    fontSize: 16,
    color: "white",
    fontWeight: "bold",
  },
});

export default MyPageScreen;
