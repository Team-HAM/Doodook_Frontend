import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import { API_BASE_URL } from "../../utils/apiConfig";

const FindPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email) {
      Alert.alert("오류", "이메일을 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}users/password_reset/request/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
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
          data.message || "비밀번호 재설정 링크를 이메일로 보냈습니다.",
          [
            {
              text: "다음",
              onPress: () =>
                navigation.navigate("ResetPassword", { email: email }),
            },
          ]
        );
      } else {
        Alert.alert("오류", data.message || "비밀번호 찾기에 실패했습니다.");
      }
    } catch (error) {
      console.error("🚨 Network Error:", error);
      Alert.alert("오류", "네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 🔙 뒤로 가기 버튼 */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Text style={styles.backText}>{"<"}</Text>
      </TouchableOpacity>

      {/* 🏷 타이틀 */}
      <Text style={styles.title}>비밀번호 찾기</Text>

      {/* 📧 이메일 입력 */}
      <Text style={styles.label}>이메일</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="가입 시 사용한 이메일 입력"
          placeholderTextColor="#ccc"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TouchableOpacity
          style={[styles.sendButton, loading && styles.disabledButton]}
          onPress={handleSendCode}
          disabled={loading}
        >
          <Text style={styles.sendButtonText}>
            {loading ? "전송 중..." : "전송"}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.infoText}>
        가입하신 이메일로 비밀번호 재설정 링크가 발송됩니다.
      </Text>
    </View>
  );
};

// ✅ 스타일 정의
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#003340",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
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

  label: {
    fontSize: 16,
    color: "#F074BA",
    alignSelf: "flex-start",
    marginTop: 10,
    marginBottom: 10,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    marginBottom: 10,
    paddingHorizontal: 10,
  },

  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "black",
  },

  sendButton: {
    width: 60,
    height: 35,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#CCCDD0",
    borderRadius: 16,
    marginLeft: 10,
  },

  disabledButton: {
    backgroundColor: "#A0A0A0",
  },

  sendButtonText: {
    fontSize: 14,
    color: "black",
  },

  infoText: {
    fontSize: 14,
    color: "#F074BA",
    textAlign: "center",
    marginTop: 20,
    opacity: 0.7,
  },
});

export default FindPasswordScreen;
