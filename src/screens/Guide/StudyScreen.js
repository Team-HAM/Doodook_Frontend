import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  StyleSheet,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import Markdown from "react-native-markdown-display";
import { API_BASE_URL } from "../../utils/apiConfig";

const StudyScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { guideId } = route.params; // ← navigation.navigate('StudyScreen', { guideId: 1 }) 형태로 호출

  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [progressIndex, setProgressIndex] = useState(0);
  const [showButton, setShowButton] = useState(true);
  const buttonAnim = useRef(new Animated.Value(1)).current;
  const scrollOffset = useRef(0);

  useEffect(() => {
    const fetchGuide = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}api/guides/${guideId}/`
        );
        const data = await res.json();
        console.log("[content]", data.content); // 🔍 확인용

        setContent(data.content); // 마크다운이지만 그냥 텍스트로 출력
      } catch (error) {
        setContent("[불러오기 실패]");
      } finally {
        setLoading(false);
      }
    };

    fetchGuide();
  }, [guideId]);

  const handleScroll = (event) => {
    const currentOffset = event.nativeEvent.contentOffset.y;
    const contentHeight = event.nativeEvent.contentSize.height;
    const scrollViewHeight = event.nativeEvent.layoutMeasurement.height;

    const scrollPercent = currentOffset / (contentHeight - scrollViewHeight);
    const level = Math.floor(scrollPercent * 5); // 0~5 단계로 나눔
    setProgressIndex(Math.min(level, 5));

    const direction = currentOffset > scrollOffset.current ? "down" : "up";
    if (direction === "down" && showButton) {
      setShowButton(false);
      Animated.timing(buttonAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else if (direction === "up" && !showButton) {
      setShowButton(true);
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    scrollOffset.current = currentOffset;
  };

  return (
    <View style={styles.container}>
      {/* 상단 바 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>{"<"}</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.chapterNumber}>1-{guideId}</Text>
          <Text style={styles.headerTitle}>학습 콘텐츠</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* 스크롤 진행 바 */}
      <View style={{ alignItems: "center" }}>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${progressIndex * 20}%` },
            ]}
          />
        </View>
      </View>

      {/* 본문 */}
      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          style={styles.scrollArea}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <Markdown style={markdownStyles}>{content}</Markdown>
        </ScrollView>
      )}

      {/* 하단 버튼 */}
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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>학습을 완료했어요</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: "#E0F4F9",
  },
  backButton: {
    marginRight: 10,
  },
  backText: {
    fontSize: 28,
    color: "#003340",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  chapterNumber: {
    fontSize: 14,
    color: "#003340",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#003340",
  },
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
  paragraph: {
    fontSize: 16,
    lineHeight: 26,
    color: "#333",
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
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

const markdownStyles = {
  body: {
    fontSize: 16,
    lineHeight: 26,
    color: "#333",
  },
  heading1: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 8,
  },
  heading2: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 18,
    marginBottom: 6,
  },
  list_item: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
};

export default StudyScreen;
