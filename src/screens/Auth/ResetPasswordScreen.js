import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
} from "react-native";
import { API_BASE_URL } from "../../utils/apiConfig";

const ResetPasswordScreen = ({ route, navigation }) => {
  // route.params가 없는 경우 처리
  const { email = "" } = route?.params || {};
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    // 입력값 검증
    if (!resetToken) {
      Alert.alert("오류", "재설정 토큰을 입력해주세요.");
      return;
    }
    if (!newPassword) {
      Alert.alert("오류", "새 비밀번호를 입력해주세요.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("오류", "비밀번호가 일치하지 않습니다.");
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert("오류", "비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}users/password_reset/confirm/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            reset_token: resetToken,
            new_password: newPassword,
          }),
        }
      );

      // 응답 타입 확인
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        console.error("서버 응답이 JSON이 아님:", textResponse);
        Alert.alert("오류", "서버 응답 형식 오류");
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          "성공",
          data.message || "비밀번호가 성공적으로 변경되었습니다.",
          [
            {
              text: "로그인하기",
              onPress: () => navigation.navigate("Login"),
            },
          ]
        );
      } else {
        Alert.alert("오류", data.message || "비밀번호 재설정에 실패했습니다.");
      }
    } catch (error) {
      console.error("🚨 Network Error:", error);
      Alert.alert("오류", "네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {/* 🔙 뒤로 가기 버튼 */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>{"<"}</Text>
        </TouchableOpacity>

        {/* 🏷 타이틀 */}
        <Text style={styles.title}>비밀번호 재설정</Text>

        <View style={styles.formContainer}>
          {/* 이메일 표시 */}
          <Text style={styles.emailText}>{email}</Text>

          {/* 토큰 입력 */}
          <Text style={styles.label}>재설정 토큰</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="이메일로 받은 재설정 토큰을 입력해 주세요"
              placeholderTextColor="#ccc"
              value={resetToken}
              onChangeText={setResetToken}
            />
          </View>

          {/* 새 비밀번호 입력 */}
          <Text style={styles.label}>새 비밀번호</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="8자 이상 입력"
              placeholderTextColor="#ccc"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
          </View>

          {/* 비밀번호 확인 입력 */}
          <Text style={styles.label}>비밀번호 확인</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="비밀번호를 다시 입력해 주세요"
              placeholderTextColor="#ccc"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          {/* 변경 버튼 */}
          <TouchableOpacity
            style={[styles.resetButton, loading && styles.disabledButton]}
            onPress={handleResetPassword}
            disabled={loading}
          >
            <Text style={styles.resetButtonText}>
              {loading ? "처리 중..." : "비밀번호 변경"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.infoText}>이메일로 받은 토큰을 입력한 후,</Text>
          <Text style={styles.infoText}>새 비밀번호를 설정해 주세요.</Text>
        </View>
      </View>
    </ScrollView>
  );
};

// ✅ 스타일 정의
const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#003340",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingBottom: 40,
  },

  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
  },
  backText: {
    fontSize: 36,
    color: "#F074BA",
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#F074BA",
    position: "absolute",
    top: 150,
    left: 30,
  },

  formContainer: {
    width: "100%",
    marginTop: 180,
    alignItems: "center",
  },

  emailText: {
    fontSize: 18,
    color: "#fff",
    marginBottom: 20,
    alignSelf: "left",
  },

  label: {
    fontSize: 16,
    color: "#F074BA",
    alignSelf: "flex-start",
    marginTop: 15,
    marginBottom: 10,
  },

  inputContainer: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    marginBottom: 10,
    paddingHorizontal: 10,
  },

  input: {
    height: 50,
    fontSize: 16,
    color: "black",
  },

  resetButton: {
    width: "100%",
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F074BA",
    borderRadius: 8,
    marginTop: 30,
    marginBottom: 50,
  },

  disabledButton: {
    backgroundColor: "#A0A0A0",
  },

  resetButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },

  infoText: {
    fontSize: 14,
    color: "#F074BA",
    textAlign: "center",
    // marginTop: 20,
    opacity: 0.7,
    fontWeight: "bold",
  },
});

export default ResetPasswordScreen;
