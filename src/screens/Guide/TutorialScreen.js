// screens/TutorialScreen.js
import React, { useRef, useState, useCallback } from "react";
import {
  View,
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  StatusBar,
  FlatList,
  SafeAreaView,
  Platform,
  TouchableOpacity,
  Text,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../../utils/apiConfig";
import { getNewAccessToken } from "../../utils/token";

// const IMAGES = [
//   require("../../assets/tutorial/tutorial-0.png"),
//   require("../../assets/tutorial/tutorial-1.png"),
//   require("../../assets/tutorial/tutorial-2.png"),
//   require("../../assets/tutorial/tutorial-3.png"),
//   require("../../assets/tutorial/tutorial-4.png"),
//   require("../../assets/tutorial/tutorial-5.png"),
//   require("../../assets/tutorial/tutorial-6.png"),
//   require("../../assets/tutorial/tutorial-6(2).png"),
//   require("../../assets/tutorial/tutorial-7.png"),
//   require("../../assets/tutorial/tutorial-8.png"),
//   require("../../assets/tutorial/tutorial-9.png"),
//   require("../../assets/tutorial/tutorial-10.png"),
//   require("../../assets/tutorial/tutorial-11.png"),
//   require("../../assets/tutorial/tutorial-12.png"),
//   require("../../assets/tutorial/tutorial-13.png"),
//   require("../../assets/tutorial/tutorial-14.png"),
//   require("../../assets/tutorial/tutorial-15.png"),
//   require("../../assets/tutorial/tutorial-16.png"),
//   require("../../assets/tutorial/tutorial-17.png"),
//   require("../../assets/tutorial/tutorial-18.png"),
//   require("../../assets/tutorial/tutorial-19.png"),
//   require("../../assets/tutorial/tutorial-20.png"),
//   require("../../assets/tutorial/tutorial-21.png"),
//   require("../../assets/tutorial/tutorial-22.png"),
// ];

const IMAGES = [
  require("../../assets/p-tutorial/p-0.png"),
  require("../../assets/p-tutorial/p-1.png"),
  require("../../assets/p-tutorial/p-2.png"),
  require("../../assets/p-tutorial/p-3.png"),
  require("../../assets/p-tutorial/p-4.png"),
  require("../../assets/p-tutorial/p-5.png"),
  require("../../assets/p-tutorial/p-6.png"),
  require("../../assets/p-tutorial/p-7.png"),
  require("../../assets/p-tutorial/p-8.png"),
  require("../../assets/p-tutorial/p-9.png"),
  require("../../assets/p-tutorial/p-10.png"),
  require("../../assets/p-tutorial/p-11.png"),
  require("../../assets/p-tutorial/p-12.png"),
  require("../../assets/p-tutorial/p-13.png"),
  require("../../assets/p-tutorial/p-14.png"),
  require("../../assets/p-tutorial/p-15.png"),
  require("../../assets/p-tutorial/p-16.png"),
  require("../../assets/p-tutorial/p-17.png"),
  require("../../assets/p-tutorial/p-18.png"),
  require("../../assets/p-tutorial/p-19.png"),
  require("../../assets/p-tutorial/p-20.png"),
  require("../../assets/p-tutorial/p-21.png"),
  require("../../assets/p-tutorial/p-22.png"),
  require("../../assets/p-tutorial/p-23.png"),
];



export default function TutorialScreen({ navigation, route }) {
  const listRef = useRef(null);
  const { width, height } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [completing, setCompleting] = useState(false);

  // GuideScreen에서 재시청 시 { allowSkip: true }
  const allowSkip = !!route?.params?.allowSkip;

  const postTutorialComplete = useCallback(async () => {
    try {
      const accessToken = await getNewAccessToken(navigation);
      if (!accessToken) {
        console.warn("No access token; skip /users/tutorial/complete/ call.");
        return false;
      }
      const res = await fetch(`${API_BASE_URL}users/tutorial/complete/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        console.warn("Tutorial complete API failed:", res.status);
        return false;
      }
      return true;
    } catch (e) {
      console.warn("Tutorial complete API error:", e);
      return false;
    }
  }, [navigation]);

  const handleComplete = useCallback(async () => {
    if (completing) return;
    setCompleting(true);

    await postTutorialComplete();
    await AsyncStorage.multiSet([
      ["hasCompletedTutorial", "true"],
      ["has_completed_tutorial", "true"],
    ]);
    navigation.reset({ index: 0, routes: [{ name: "MainTab" }] });
  }, [postTutorialComplete, navigation, completing]);

  const handleNext = useCallback(() => {
    if (index < IMAGES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      handleComplete();
    }
  }, [index, handleComplete]);

  const renderItem = useCallback(
    ({ item }) => {
      const asset = Image.resolveAssetSource(item);
      const aspect = asset?.width && asset?.height ? asset.width / asset.height : 1;
      const imgWidth = width;
      const imgHeight = imgWidth / aspect;

      return (
        <Pressable
          style={[styles.slide, { width, height }]}
          onPress={handleNext}
          disabled={completing}
        >
          <Image
            source={item}
            style={{ width: imgWidth, height: imgHeight, alignSelf: "center" }}
          />
        </Pressable>
      );
    },
    [width, height, handleNext, completing]
  );

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      setIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const progress = (index + 1) / IMAGES.length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#003340" />

      {/* 상단 진행 바 + (바 바로 우측 하단) Skip */}
      <SafeAreaView style={styles.topBar}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { flex: progress }]} />
          <View style={{ flex: Math.max(0, 1 - progress) }} />
        </View>

        {allowSkip && (
          <View style={styles.skipInlineWrap}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.skipInlineText}>건너뛰기</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>

      <FlatList
        ref={listRef}
        data={IMAGES}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        initialScrollIndex={0}
        extraData={width}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#003340" },

  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) : 0,
    paddingHorizontal: 16,
  },

  // 진행 바 (좌우 살짝 공백)
  progressBar: {
    flexDirection: "row",
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.25)",
    marginTop: 8,
    marginBottom: 4,
    marginHorizontal: 30,
  },
  progressFill: { backgroundColor: "#F074BA" },

  // ⬇️ bar '바로 우측 하단' Skip (bar와 같은 우측 여백으로 정렬)
  skipInlineWrap: {
    alignItems: "flex-end",
    marginRight: 30,
    marginTop: 6, // bar 바로 아래 느낌
  },
  skipInlineText: {
    backgroundColor: "#CBD5D700",
    borderRadius: 99,
    color: "#EFF1F5D0",
    fontSize: 16,
    //opacity: 0.9,
    //paddingHorizontal: 18,
    paddingVertical: 8,
  },

  // 위만 잘리도록: 하단 정렬 + 넘침 숨김
  slide: {
    overflow: "hidden",
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: "#003340",
  },
});
