import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { API_BASE_URL } from "../../utils/apiConfig";
import EyeOpen from "../../components/EyeOpen";
import EyeClosed from "../../components/EyeClosed";

// ✅ 현재 기기의 높이 가져오기
const { height } = Dimensions.get("window");

const SignUp2Screen = ({ navigation }) => {
  const [seePassword, setSeePassword] = useState(true);
  const [seeConfirmPassword, setSeeConfirmPassword] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // const [email, setEmail] = useState("");
  // const [password, setPassword] = useState("");
  // const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState("");
  const [nickname, setNickname] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidDate = (date) => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    return dateRegex.test(date);
  };

const handleSignUp = async () => {
  if (isLoading) return; // 혹시나 중복 방지

  setIsLoading(true); // 🔐 시작할 때 로딩 ON

  if (!validateEmail(email)) {
    Alert.alert("오류", "올바른 이메일 형식을 입력해주세요.");
    setIsLoading(false); return;
  }

  if (password.length < 6) {
    Alert.alert("오류", "비밀번호는 최소 6자 이상이어야 합니다.");
    setIsLoading(false); return;
  }

  if (password !== confirmPassword) {
    Alert.alert("오류", "비밀번호가 일치하지 않습니다.");
    setIsLoading(false); return;
  }

  if (!gender || !nickname || !birthdate || !address) {
    Alert.alert("오류", "모든 필드를 입력해주세요.");
    setIsLoading(false); return;
  }

  if (!isValidDate(birthdate)) {
    Alert.alert("오류", "생년월일은 YYYY-MM-DD 형식으로 입력해야 합니다.");
    setIsLoading(false); return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}users/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, gender, nickname, birthdate, address }),
    });

    const data = await response.json();
    console.log("✅ 회원가입 응답 데이터:", data);

    if (response.status === 201 && data.status === "success") {
      const { id } = data.data;
      Alert.alert(
        "이메일로 링크 전송",
        "이메일에서 인증 링크를 클릭하여,\n회원가입을 진행해주세요.",
        [
          {
            text: "확인",
            onPress: () => navigation.navigate("SignUp3", { email, id }),
          },
        ]
      );
    } else if (response.status === 400 && data.errors?.email) {
      Alert.alert("오류", "이미 존재하는 이메일입니다. 다른 이메일을 사용해주세요.");
    } else {
      Alert.alert("오류", data.message || "회원가입 실패");
    }
  } catch (error) {
    console.error("🚨 Network Error:", error);
    Alert.alert("오류", "네트워크 오류가 발생했습니다.");
  } finally {
    setIsLoading(false); // ✅ 요청 끝나면 로딩 OFF
  }
};


  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Text style={styles.backText}>{"<"}</Text>
      </TouchableOpacity>
      <Text style={styles.title}>회원가입</Text>

      {/* ✅ 스크롤 가능한 입력 영역 */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ✅ 이메일 입력 */}
        <Text style={styles.label}>이메일</Text>
        <TextInput
          style={styles.input}
          placeholder="이메일 입력"
          placeholderTextColor="#ccc"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        {/* ✅ 비밀번호 입력 */}
        {/* <Text style={styles.label}>비밀번호</Text>
        <TextInput
          style={styles.input}
          placeholder="비밀번호 입력"
          placeholderTextColor="#ccc"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          textContentType="none"
          autoComplete="off"
        /> */}
          <Text style={styles.label}>비밀번호</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.inputField}
          placeholder="비밀번호 입력"
          placeholderTextColor="#ccc"
          secureTextEntry={seePassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity
          onPress={() => setSeePassword(!seePassword)}
          style={styles.icon}
        >
          {seePassword ? <EyeClosed /> : <EyeOpen />}
        </TouchableOpacity>
      </View>
<Text style={styles.passwordGuide}>
  영문 대,소문자/숫자/특수문자 중 2가지 이상 조합, 8자~32자
</Text>

        {/* ✅ 비밀번호 확인 */}
        <Text style={styles.label}>비밀번호 확인</Text>
        <TextInput
          style={styles.input}
          placeholder="비밀번호 확인"
          placeholderTextColor="#ccc"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

{confirmPassword.length > 0 && password === confirmPassword ? (
  <Text style={styles.passwordMatch}>비밀번호가 일치합니다.</Text>
) : (
  confirmPassword.length > 0 && (
    <Text style={{ color: "tomato", fontSize: 12, marginLeft: 4, marginBottom: 10, }}>
      비밀번호가 일치하지 않습니다.
    </Text>
  )
)}

        {/* ✅ 성별 선택 */}
        <Text style={styles.label}>성별</Text>
        <View style={styles.genderContainer}>
          <Pressable
            style={[styles.checkBox, gender === "male" && styles.checkedBox]}
            onPress={() => setGender("male")}
          >
            {gender === "male" && <Text style={styles.checkMark}>✓</Text>}
          </Pressable>
          <Text style={styles.checkBoxText}>남성</Text>

          <Pressable
            style={[styles.checkBox, gender === "female" && styles.checkedBox]}
            onPress={() => setGender("female")}
          >
            {gender === "female" && <Text style={styles.checkMark}>✓</Text>}
          </Pressable>
          <Text style={styles.checkBoxText}>여성</Text>
        </View>

        {/* ✅ 닉네임 입력 */}
        <Text style={styles.label}>닉네임</Text>
        <TextInput
          style={styles.input}
          placeholder="닉네임 입력"
          value={nickname}
          onChangeText={setNickname}
        />

        {/* ✅ 생년월일 입력 */}
        <Text style={styles.label}>생년월일</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={birthdate}
          onChangeText={setBirthdate}
        />

        {/* ✅ 주소 입력 */}
        <Text style={styles.label}>주소</Text>
        <TextInput
          style={styles.input}
          placeholder="주소 입력"
          value={address}
          onChangeText={setAddress}
        />
      </ScrollView>

      {/* ✅ 다음 버튼 */}
      {/* <TouchableOpacity style={styles.button} onPress={handleSignUp}>
        <Text style={styles.buttonText}>인증하기</Text>
      </TouchableOpacity> */}
      <TouchableOpacity
  style={[styles.button, isLoading && { opacity: 0.6 }]}
  onPress={handleSignUp}
  disabled={isLoading}
>
  {isLoading ? (
    <ActivityIndicator color="#fff" />
  ) : (
    <Text style={styles.buttonText}>인증하기</Text>
  )}
</TouchableOpacity>

    </View>
  );
};
const styles = StyleSheet.create({
  // container: {
  //   flex: 1,
  //   backgroundColor: '#003340',
  //   justifyContent: 'center',
  //   paddingHorizontal: 30,
  // },
  // container: {
  //   flex: 1,
  //   backgroundColor: '#003340',
  //   paddingHorizontal: 30,
  //   paddingTop: 60,
  // },
  container: {
    flexGrow: 1,
    backgroundColor: "#003340",
    // alignItems: 'center',
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

  // scrollContainer: {
  //   flex: 1,
  //   marginTop: height * 0.25,  // 🔥 전체 높이의 20%부터 시작
  //   marginBottom: height * 0.15,  // 🔥 전체 높이의 15% 공간 확보
  // },
  // scrollContent: {
  //   paddingBottom: height * 0.02,  // 🔥 전체 높이의 2% 여백 추가
  // },

  // scrollView: {
  //   flex: 1,
  //   marginTop: 150,
  //   marginBottom: 20,
  //   maxHeight: 400,
  // },

  scrollContainer: {
    flex: 1,
    marginTop: 0,
    marginBottom: 20,
    maxHeight: 400,
  },

  // scrollContainer: {
  //   flex: 1,
  //   marginTop: 200,
  //   marginBottom: 150,
  // },
  // scrollContent: {
  //   paddingBottom: 20,
  // },
  label: {
    fontSize: 16,
    color: "#F074BA",
    marginTop: 10,
    marginBottom: 10,
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
    color: "black",
  },

  passwordGuide: {
  fontSize: 12,
  color: "#ccc",
  marginBottom: 10,
  marginLeft: 4,
},

passwordMatch: {
  fontSize: 12,
  color: "#00e676", // 밝은 녹색
  marginBottom: 10,
  marginLeft: 4,
},



  inputContainer: {
  flexDirection: "row",
  alignItems: "center",
  width: "100%",
  borderWidth: 1,
  borderColor: "#ddd",
  borderRadius: 8,
  backgroundColor: "#f9f9f9",
  marginBottom: 15,
  paddingHorizontal: 10,
},
inputField: {
  flex: 1,
  height: 50,
  fontSize: 16,
  color: "black",
},
icon: {
  padding: 10,
},















  genderContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginTop: 5,
    marginBottom: 15,
  },
  checkBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#F074BA",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  checkedBox: {
    backgroundColor: "#F074BA",
  },
  checkMark: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  checkBoxText: {
    fontSize: 16,
    color: "#F074BA",
    marginLeft: 9,
    marginRight: 15,
  },

  // button: {
  //   width: '100%',
  //   height: 50,
  //   backgroundColor: '#F074BA',
  //   borderRadius: 8,
  //   alignItems: 'center',
  //   justifyContent: 'center',
  //   marginTop: 15,
  //   marginBottom: 200,

  // },
  // buttonText: {
  //   color: '#fff',
  //   fontSize: 18,
  //   fontWeight: 'bold',
  // },

  button: {
    width: "100%",
    height: 50,
    backgroundColor: "#F074BA",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    bottom: 80,
    alignSelf: "center",
  },

  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default SignUp2Screen;
