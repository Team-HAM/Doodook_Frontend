import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { getNewAccessToken } from "../../utils/token";
import { fetchUserInfo } from "../../utils/user";
import { API_BASE_URL } from "../../utils/apiConfig";
//import { fetchPortfolio } from '../utils/portfolio';

const TradingBuyScreen = ({ route, navigation }) => {
  const stock = route.params?.stock;
  const [portfolioData, setPortfolioData] = useState([]);
  const [quantity, setQuantity] = useState("1");
  const [currentPrice, setCurrentPrice] = useState(stock?.price || 0);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);

  // 쉼표 제거 후 파싱
  const parsedPrice = parseInt(currentPrice.toString().replace(/,/g, "")) || 0;
  const total = parseInt(quantity || 0) * parsedPrice;

  useEffect(() => {
    const init = async () => {
      await fetchUserInfo(navigation, (info) => {
        if (info?.id) setUserId(info.id);
      });
    };
    init();
  }, []);

  // useEffect(() => {
  //   const unsubscribe = navigation.addListener('focus', () => {
  //     console.log("📥 다시 focus됨: 포트폴리오 재요청");
  //     fetchPortfolio(navigation, setPortfolioData, setLoading);
  //   });

  //   return unsubscribe;
  // }, [navigation]);

  // TradingBuyScreen.js의 handleBuy 함수 수정 부분

  const handleBuy = async () => {
    console.log("💰 실제 매수 프로세스 시작!");

    if (!stock || !stock.name) {
      console.error("❌ stock 정보 없음");
      Alert.alert("오류", "주식 정보가 올바르지 않습니다.");
      return;
    }

    if (!quantity || parseInt(quantity) <= 0) {
      console.error("❌ 수량 오류");
      Alert.alert("오류", "올바른 수량을 입력해주세요.");
      return;
    }

    if (parsedPrice <= 0) {
      console.error("❌ 가격 오류");
      Alert.alert("오류", "주식 가격 정보가 올바르지 않습니다.");
      return;
    }

    setLoading(true);

    try {
      console.log("🔄 매수 요청 시작...");

      const accessToken = await getNewAccessToken(navigation);
      if (!accessToken || !userId) {
        console.error(
          "❌ 인증 실패 - accessToken:",
          !!accessToken,
          "userId:",
          userId
        );
        Alert.alert("오류", "사용자 인증에 실패했습니다.");
        return;
      }

      // 🔧 종목 식별자 결정 로직
      let stockSymbolForAPI;

      if (stock._source === "recommended" && stock.stock_symbol) {
        // 추천 주식인 경우 종목코드 사용
        stockSymbolForAPI = stock.stock_symbol;
        console.log("📊 추천 주식 - 종목코드 사용:", stockSymbolForAPI);
      } else if (stock.symbol) {
        // symbol이 있으면 종목코드 사용
        stockSymbolForAPI = stock.symbol;
        console.log("📊 종목코드 사용:", stockSymbolForAPI);
      } else {
        // 기본적으로 name 사용 (기존 보유 주식)
        stockSymbolForAPI = stock.name;
        console.log("📊 종목명 사용:", stockSymbolForAPI);
      }

      const postData = {
        user_id: userId,
        stock_symbol: stockSymbolForAPI, // 🔧 결정된 식별자 사용
        order_type: "buy",
        quantity: parseInt(quantity),
        price: parsedPrice,
      };

      console.log("📡 API 요청 데이터:", postData);
      console.log("🔍 stock._source:", stock._source);
      console.log("🔍 stock.stock_symbol:", stock.stock_symbol);
      console.log("🔍 stock.symbol:", stock.symbol);
      console.log("🔍 stock.name:", stock.name);
      console.log("🔍 최종 사용된 stock_symbol:", stockSymbolForAPI);

      const response = await fetch(`${API_BASE_URL}trading/trade/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      console.log("📬 응답 상태:", response.status);

      const responseText = await response.text();
      console.log("📦 응답 본문:", responseText);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error("❌ JSON 파싱 실패:", parseError);
        Alert.alert("❌ 서버 오류", "서버 응답 형식이 올바르지 않습니다.");
        return;
      }

      if (response.ok && result?.status === "success") {
        Alert.alert("매수 성공", result.message || "매수가 완료되었습니다.");
        navigation.goBack();
      } else {
        console.error("❌ 매수 실패:", result);
        Alert.alert(
          "❌ 매수 실패",
          result?.message || `오류 발생 (${response.status})`
        );
      }
    } catch (error) {
      console.error("❌ 매수 오류:", error);
      Alert.alert("❌ 요청 실패", "매수 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>{"<"}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>매수</Text>
        </View>

        {/* 종목 정보 */}
        <View style={styles.stockRow}>
          <Text style={styles.stockName}>{stock.name}</Text>
          <View style={styles.priceBlock}>
            <Text style={styles.priceText}>
              {parsedPrice.toLocaleString()}원
            </Text>
            <Text style={styles.changeText}>
              {parseFloat(stock.change) >= 0 ? "▲" : "▼"}
              {Math.abs(parseFloat(stock.change)).toFixed(2)}%
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* 보유량 */}
        <Text style={styles.label}>현재 보유량</Text>
        <Text style={styles.value}>{stock.quantity}주</Text>

        {/* 수량 입력 */}
        <Text style={[styles.label, { marginTop: 30 }]}>
          얼마나 매수할까요?
        </Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            maxLength={3}
          />
          <Text style={styles.unit}>주</Text>
        </View>

        {/* 총 금액 */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>총</Text>
          <Text style={styles.totalAmount}>-{total.toLocaleString()}원</Text>
        </View>

        {/* 매수 버튼 */}
        <TouchableOpacity
          style={styles.buyButton}
          onPress={handleBuy}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#003340" />
          ) : (
            <Text style={styles.buyButtonText}>매수하기</Text>
          )}
        </TouchableOpacity>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#003340",
    paddingHorizontal: 30,
    paddingTop: 60,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  backText: {
    fontSize: 28,
    color: "#F074BA",
    marginRight: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#F074BA",
  },
  stockRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stockName: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  priceBlock: {
    alignItems: "flex-end",
  },
  priceText: {
    fontSize: 18,
    color: "white",
  },
  changeText: {
    fontSize: 14,
    color: "#F074BA",
  },
  divider: {
    height: 1,
    backgroundColor: "#4A5A60",
    marginVertical: 20,
  },
  label: {
    fontSize: 16,
    color: "#FFD1EB",
  },
  value: {
    fontSize: 20,
    color: "#FFFFFF",
    fontWeight: "bold",
    marginTop: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
    fontSize: 18,
    color: "#000000",
    width: 80,
    textAlign: "center",
  },
  unit: {
    fontSize: 18,
    color: "#FFFFFF",
    marginLeft: 10,
  },
  totalRow: {
    marginTop: 30,
    flexDirection: "row",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4CD964",
    marginLeft: 10,
  },
  buyButton: {
    marginTop: "auto",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 20,
  },
  buyButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#003340",
  },
});

export default TradingBuyScreen;
