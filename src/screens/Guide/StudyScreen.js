import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  StyleSheet,
  Alert,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import Markdown from "react-native-markdown-display";
import { API_BASE_URL } from "../../utils/apiConfig";
import { getNewAccessToken } from "../../utils/token";

const StudyScreen = () => {
  const { level, contentIndex } = useRoute().params;
  const navigation = useNavigation();

  // map level & contentIndex → advanced-guide id
  const guideApiId = 
    level === 1
      ? contentIndex
      : level === 2
      ? contentIndex + 8
      : contentIndex + 13;

  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  const [progressIndex, setProgressIndex] = useState(0);
  const [showButton, setShowButton] = useState(true);
  const buttonAnim = useRef(new Animated.Value(1)).current;
  const scrollOffset = useRef(0);

  // fetch guide content
  useEffect(() => {
    const fetchGuide = async () => {
      const accessToken = await getNewAccessToken(navigation);
      if (!accessToken) {
        Alert.alert("인증 오류", "토큰이 만료되었습니다. 다시 로그인해주세요.");
        navigation.navigate("Login");
        return;
      }
      try {
        const res = await fetch(
          `${API_BASE_URL}api/advanced-guides/${guideApiId}/`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        if (!res.ok) throw new Error(`Failed to load (${res.status})`);
        const data = await res.json();
        setContent(data.content);
      } catch (err) {
        console.error(err);
        setContent("[불러오기 실패]");
      } finally {
        setLoading(false);
      }
    };
    fetchGuide();
  }, [guideApiId, navigation]);

  // handle scroll for progress bar & button
  const handleScroll = (e) => {
    const y = e.nativeEvent.contentOffset.y;
    const scrollH = e.nativeEvent.contentSize.height - e.nativeEvent.layoutMeasurement.height;
    const pct = scrollH > 0 ? y / scrollH : 0;
    setProgressIndex(Math.min(5, Math.floor(pct * 5)));

    const dir = y > scrollOffset.current ? "down" : "up";
    if (dir === "down" && showButton) {
      setShowButton(false);
      Animated.timing(buttonAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    } else if (dir === "up" && !showButton) {
      setShowButton(true);
      Animated.timing(buttonAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
    scrollOffset.current = y;
  };

  // mark complete
  const handleComplete = async () => {
    setCompleting(true);
    const accessToken = await getNewAccessToken(navigation);
    if (!accessToken) {
      Alert.alert("인증 오류", "토큰이 만료되었습니다. 다시 로그인해주세요.");
      navigation.navigate("Login");
      return;
    }
    try {
      const res = await fetch(
        `${API_BASE_URL}progress/complete/${level}/${contentIndex}/`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (!res.ok) throw new Error(`Complete failed (${res.status})`);
      // 돌아가서 GuideLevel 화면이 리프레시되도록
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Alert.alert("오류", "완료 처리 중 문제가 발생했습니다.");
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#003340" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>{"<"}</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.chapterNumber}>{`${level}-${contentIndex}`}</Text>
          <Text style={styles.headerTitle}>학습 콘텐츠</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* progress bar */}
      <View style={{ alignItems: "center" }}>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${(progressIndex / 5) * 100}%` },
            ]}
          />
        </View>
      </View>

      {/* body */}
      <ScrollView
        style={styles.scrollArea}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <Markdown style={markdownStyles}>{content}</Markdown>
      </ScrollView>

      {/* complete button */}
      <Animated.View
        style={[
          styles.completeButton,
          {
            transform: [
              {
                translateY: buttonAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [100, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleComplete}
          disabled={completing}
          style={completing && { opacity: 0.6 }}
        >
          {completing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>학습을 완료했어요</Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F9FA" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: "#E0F4F9",
  },
  backButton: { marginRight: 10 },
  backText: { fontSize: 28, color: "#003340" },
  headerTitleContainer: { flex: 1, alignItems: "center" },
  chapterNumber: { fontSize: 14, color: "#003340" },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#003340" },

  progressBarContainer: {
    height: 6,
    width: "80%",
    backgroundColor: "#D0DCE0",
    borderRadius: 3,
    marginTop: 10,
    marginBottom: 6,
  },
  progressBarFill: {
    height: 6,
    backgroundColor: "#00AACC",
    borderRadius: 3,
  },

  scrollArea: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 70,
  },

  completeButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#003340",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

const markdownStyles = {
  body: { fontSize: 16, lineHeight: 26, color: "#333" },
  heading1: { fontSize: 22, fontWeight: "bold", marginTop: 20, marginBottom: 8 },
  heading2: { fontSize: 20, fontWeight: "bold", marginTop: 18, marginBottom: 6 },
  list_item: { flexDirection: "row", alignItems: "flex-start" },
};

export default StudyScreen;
