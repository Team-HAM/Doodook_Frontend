import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";

const SignUp4Screen = ({ navigation }) => {
  const handleGoToLogin = () => {
    navigation.replace("Login");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* 🎊 일러스트 이미지로 교체 */}
      <Image
        source={require("../../assets/hamham.png")} // ✅ PNG/SVG 일러스트 추가 필요
        style={styles.image}
        resizeMode="contain"
      />

      <Text style={styles.title}>가입이 완료되었어요!</Text>
      <Text style={styles.subtitle}>
        두둑에 오신 걸 환영합니다!{`\n`}지금 바로 로그인해볼까요?
      </Text>

      <TouchableOpacity style={styles.button} onPress={handleGoToLogin}>
        <Text style={styles.buttonText}>로그인하러 가기</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#003340",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingBottom: 60,
  },
  image: {
    width: 300,
    height: 300,
    marginBottom: 0,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#F074BA",
    marginTop: 18,
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 24,
  },
  button: {
    width: "100%",
    height: 52,
    backgroundColor: "#F074BA",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4, // Android 그림자
    shadowColor: "#000", // iOS 그림자
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default SignUp4Screen;
