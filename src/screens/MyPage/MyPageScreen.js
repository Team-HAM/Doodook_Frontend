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
import Icon from "react-native-vector-icons/Feather";
import { API_BASE_URL } from "../../utils/apiConfig";

import { getNewAccessToken } from "../../utils/token";
import { fetchUserInfo } from "../../utils/user";
import { fetchUserMbtiType, getMbtiImage } from "../../utils/mbtiType";
import { increaseBalance } from "../../utils/point";


const MyPageScreen = ({ navigation }) => {
  console.log("📌 MyPageScreen 렌더링");

  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [badgeList, setBadgeList] = useState([]); // 전체 뱃지

  const [equippedBadges, setEquippedBadges] = useState(["🔥", "🌟", "💯"]);
  const [introText, setIntroText] = useState("티끌 모아 태산이긴해!");
  const [isEditingIntro, setIsEditingIntro] = useState(false);

  //const profileImage = require("../../assets/profile.png");
  const [mbtiType, setMbtiType] = useState(null);

  const DEPOSIT_AMOUNT = 100000;


useEffect(() => {
  fetchUserMbtiType(navigation, setMbtiType);
}, []);


  const saveIntroText = async (text) => {
    try {
      // 서버로 PATCH 요청
      // await updateIntroAPI(text);
      console.log("✔ 한줄소개 저장됨:", text);
    } catch (err) {
      Alert.alert("저장 실패", "한줄소개 저장에 실패했습니다.");
    }
  };

  const MenuButton = ({ label, onPress }) => (
    <TouchableOpacity style={styles.menuButton} onPress={onPress}>
      <View style={styles.menuRow}>
        <Text style={styles.menuText}>{label}</Text>
        <Icon name="chevron-right" size={20} color="#ffffff" />
      </View>
    </TouchableOpacity>
  );

  // const handleLogout = () => {
  //   Alert.alert("로그아웃", "정상적으로 로그아웃되었습니다.");
  //   navigation.navigate("Login");
  // };

  const handleLogout = async () => {
  try {
    const accessToken = await getNewAccessToken(navigation);
    if (!accessToken) {
      Alert.alert(
        "인증 오류",
        "토큰이 만료되었습니다. 다시 로그인해주세요."
      );
      navigation.navigate("Login");
      return;
    }

    const response = await fetch(`${API_BASE_URL}logout/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      Alert.alert("로그아웃", "정상적으로 로그아웃되었습니다.");
      navigation.navigate("Login");
    } else {
      const text = await response.text();
      console.error("로그아웃 실패 응답:", text);
      Alert.alert("오류", "로그아웃에 실패했습니다.");
    }
  } catch (err) {
    console.error("로그아웃 중 오류:", err);
    Alert.alert("오류", "네트워크 오류로 로그아웃에 실패했습니다.");
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
              const accessToken = await getNewAccessToken(navigation);
              if (!accessToken) {
                Alert.alert(
                  "인증 오류",
                  "토큰이 만료되었습니다. 다시 로그인해주세요."
                );
                navigation.navigate("Login");
                return;
              }

              const response = await fetch(
                `${API_BASE_URL}users/delete/`,
                {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                  },
                }
              );

              if (response.ok) {
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
        {/* <View style={styles.profileLeft}>
          <Image
            source={
              userInfo?.profileImage
                ? { uri: userInfo.profileImage }
                : require("../../assets/profile.png")
            }
            style={styles.profileImage}
          />
        </View> */}
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
      <Text style={styles.moneyTitle}>🐹 햄햄이네 해바라기씨 농장</Text>
      <View style={styles.moneyButtonContainer}>
        {/* <TouchableOpacity
          style={styles.tiggleButton}
          onPress={() => navigation.navigate("Tiggle")}
        >
          <Text style={styles.moneyButtonText}>티끌 모으기</Text>
        </TouchableOpacity> */}

            <TouchableOpacity
      style={styles.tiggleButton}
      onPress={async () => {
        try {
          const message = await increaseBalance(navigation, DEPOSIT_AMOUNT);
          Alert.alert("티끌 모으기", message);
        } catch (error) {
          Alert.alert("에러", error.message || "티끌 모으기에 실패했습니다.");
        }
      }}
    >
      <Text style={styles.moneyButtonText}>티끌 모으기</Text>
    </TouchableOpacity>

        <TouchableOpacity
          style={styles.taesanButton}
          onPress={() => navigation.navigate("Taesan")}
        >
          <Text style={styles.moneyButtonText}>태산 만들기</Text>
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
        {/* <MenuButton
          label="테마 설정"
          onPress={() => console.log("EditTheme")}
        /> */}
        <MenuButton
          label="공지사항"
          onPress={() => navigation.navigate("Notice")}
        />
        <MenuButton
          label="자주 묻는 질문(FAQ)"
          onPress={() =>  navigation.navigate("FAQ")}
        />
        <MenuButton label="로그아웃" onPress={handleLogout} />
        <MenuButton label="회원 탈퇴" onPress={handleDeleteAccount} />
      </ScrollView>
    </View>
  );
};

const InfoItem = ({ label, value }) => (
  <View style={styles.infoBox}>
    <Text style={styles.infoLabel}>{label}:</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  // container: {
  //   flex: 1,
  //   backgroundColor: '#003340',
  //   alignItems: 'center',
  //   padding: 20,
  // },

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
    backgroundColor: "#D4DDEF60", // ✅ 원하는 배경색

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
    // textShadowColor: '#CCC',
    // textShadowOffset: { width: 1, height: 1 },
    // textShadowRadius: 3,
  },

  scrollContainer: {
    width: "100%",
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
