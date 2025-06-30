// GuideScreen.js
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Feather";
import LearningProgressBar from "../../components/LearningProgressBar";
import InspectIcon from "../../assets/icons/stock-inspect.svg";
import ResultIcon from "../../assets/icons/stock-result.svg";
import LockIcon from "../../assets/icons/lock.svg";
import { API_BASE_URL } from "../../utils/apiConfig";
import { getNewAccessToken } from "../../utils/token";

const LEVELS = [1, 2, 3];

const GuideScreen = () => {
  const navigation = useNavigation();
  const [progressMap, setProgressMap] = useState({});
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const loadAllProgress = async () => {
        setLoading(true);
        const accessToken = await getNewAccessToken(navigation);
        if (!accessToken) {
          Alert.alert("인증 오류", "토큰이 만료되었습니다. 다시 로그인해주세요.");
          navigation.navigate("Login");
          return;
        }

        try {
          const map = {};
          for (const levelId of LEVELS) {
            const res = await fetch(
              `${API_BASE_URL}progress/level/${levelId}/`,
              {
                method: "GET",
                headers: { Authorization: `Bearer ${accessToken}` },
              }
            );
            if (!res.ok) {
              throw new Error(`Level ${levelId} fetch failed: ${res.status}`);
            }
            map[levelId] = await res.json();
          }
          setProgressMap(map);
        } catch (err) {
          console.error(err);
          Alert.alert(
            "데이터 오류",
            "진행도 정보를 불러오는 중 오류가 발생했습니다."
          );
        } finally {
          setLoading(false);
        }
      };

      loadAllProgress();
    }, [navigation])
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  const ClearButton = ({ label, onPress }) => (
    <TouchableOpacity style={styles.clearButton} onPress={onPress}>
      <View style={styles.menuRow}>
        <Text style={styles.menuText}>{label}</Text>
        <Icon name="chevron-right" size={20} color="#ffffff" />
      </View>
    </TouchableOpacity>
  );

  const UnClearButton = ({ onPress, children }) => (
    <TouchableOpacity style={styles.unclearButton} onPress={onPress}>
      <View style={styles.menuRow}>
        {children}
        <Icon name="chevron-right" size={20} color="#ffffff" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧠 주식유형 검사하기</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.examButton}
          onPress={() => navigation.navigate("TypeExam")}
        >
          <InspectIcon width={90} height={90} />
          <Text style={styles.buttonText}>유형 검사하기</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.resultButton}
          onPress={() => navigation.navigate("TypeResult")}
        >
          <ResultIcon width={90} height={90} />
          <Text style={styles.buttonText}>유형 결과 확인하기</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />
      <Text style={styles.title}>✏️ 주식 초보를 위한 학습가이드</Text>
      <ScrollView
        contentContainerStyle={styles.menuContainer}
        showsVerticalScrollIndicator={false}
      >
        {LEVELS.map((levelId) => {
          const data = progressMap[levelId] || {
            completed: 0,
            total: 0,
            is_level_completed: false,
            progress_ratio: "0/0",
          };

          // 1단계는 항상 잠금 해제.
          // 그 외에는 이전 단계 완료 여부로 잠금 상태 결정
          const prevComplete =
            levelId === 1 || progressMap[levelId - 1]?.is_level_completed;
          const showLockIcon = !prevComplete;

          const label = `${levelId}단계`;
          const onPress = () => navigation.navigate(`GuideLevel${levelId}`);

          return (
            <View key={levelId}>
              {data.is_level_completed ? (
                <ClearButton label={label} onPress={onPress} />
              ) : (
          <UnClearButton onPress={onPress}>
            <View style={styles.labelWithIcon}>
              <Text style={styles.menuText}>{label}</Text>
              {showLockIcon && (
                <LockIcon
                  style={styles.lockIcon}
                  width={20}
                  height={20}
                />
              )}
            </View>
          </UnClearButton>
              )}
              <LearningProgressBar
                current={data.completed}
                total={data.total}
              />
            </View>
          );
        })}
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
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: "#EEEEEE",
    fontSize: 18,
    marginBottom: 20,
    marginLeft: 15,
    marginTop: 5,
    fontWeight: "600",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  examButton: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: "#6EE69EE0",
    borderRadius: 20,
    marginHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  resultButton: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: "#F074BAE0",
    borderRadius: 20,
    marginHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  buttonText: {
    fontFamily: "System",
    color: "#EFF1F5",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "#4A5A60",
    marginVertical: 20,
  },
  menuContainer: {
    paddingBottom: 30,
  },
  menuRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  clearButton: {
    backgroundColor: "#D4DDEF60",
    padding: 15,
    borderRadius: 15,
    marginVertical: 5,
    marginHorizontal: 10,
  },
  unclearButton: {
    backgroundColor: "#D4DDEF20",
    padding: 15,
    borderRadius: 15,
    marginVertical: 5,
    marginHorizontal: 10,
  },
  labelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
  },
  lockIcon: {
    marginLeft: 6,
    marginTop: 1,
  },
  menuText: {
    fontSize: 16,
    color: "white",
    fontWeight: "bold",
  },
});

export default GuideScreen;
