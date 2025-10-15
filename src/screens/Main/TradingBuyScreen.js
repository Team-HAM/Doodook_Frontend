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
import { fetchWithHantuToken } from "../../utils/hantuToken";
import { fetchUserInfo } from "../../utils/user";
import { API_BASE_URL } from "../../utils/apiConfig";
import { fetchWithAuth } from "../../utils/token"; // fetchWithAuth 사용

const TradingBuyScreen = ({ route, navigation }) => {
  const stock = route.params?.stock;
  const [quantity, setQuantity] = useState("1");
  const [currentPrice, setCurrentPrice] = useState(0);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [priceLoading, setPriceLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      // 사용자 정보 가져오기
      await fetchUserInfo(navigation, (info) => {
        if (info?.id) setUserId(info.id);
      });

      // 현재가 가져오기
      await fetchCurrentPrice(stock?.symbol);
    };
    init();
  }, []);

  const fetchCurrentPrice = async (stockCode) => {
    if (!stockCode) {
      console.error("❌ 종목 코드가 없습니다.");
      setPriceLoading(false);
      return;
    }

    try {
      setPriceLoading(true);

      const result = await fetchWithHantuToken(
        `${API_BASE_URL}trading/stock_price/?stock_code=${stockCode}`
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      const data = result.data;

      if (data && data.current_price) {
        setCurrentPrice(data.current_price);
        console.log("✅ 현재가 업데이트:", data.current_price);
      } else {
        console.warn("⚠️ 현재가 API 응답 실패:", data);
        // 기존 주식 가격을 사용
        setCurrentPrice(
          typeof stock.price === "string"
            ? parseInt(stock.price.replace(/,/g, ""))
            : stock.price
        );
      }
    } catch (error) {
      console.error("❌ 현재가 조회 실패:", error);
      // 기존 주식 가격을 사용
      setCurrentPrice(
        typeof stock.price === "string"
          ? parseInt(stock.price.replace(/,/g, ""))
          : stock.price
      );
    } finally {
      setPriceLoading(false);
    }
  };

  const calculateTotal = () => {
    const qty = parseInt(quantity) || 0;
    return currentPrice * qty;
  };

  const handleBuy = async () => {
    console.log("💰 매수 주문 시작");

    if (!stock || !stock.name) {
      Alert.alert("오류", "주식 정보가 올바르지 않습니다.");
      return;
    }

    const qty = parseInt(quantity);
    if (!qty || qty <= 0) {
      Alert.alert("오류", "올바른 수량을 입력해주세요.");
      return;
    }

    if (currentPrice <= 0) {
      Alert.alert("오류", "주식 가격 정보가 올바르지 않습니다.");
      return;
    }

    setLoading(true);

    try {
      // 종목 식별자 결정 (종목코드 우선 사용)
      const stockIdentifier = stock.symbol || stock.name;

      const orderData = {
        user_id: userId,
        stock_symbol: stockIdentifier,
        order_type: "buy",
        quantity: qty,
        price: currentPrice,
      };

      console.log("📡 매수 주문 데이터:", orderData);

      // ✅ fetchWithAuth 사용 (일반 백엔드 API이므로)
      const response = await fetchWithAuth(
        `${API_BASE_URL}trading/trade/`,
        {
          method: "POST",
          body: JSON.stringify(orderData),
        },
        navigation
      );

      console.log("📬 매수 주문 응답 상태:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ 매수 주문 실패 응답:", errorText);
        Alert.alert("매수 실패", `서버 오류: ${response.status}`);
        return;
      }

      const result = await response.json();
      console.log("📬 매수 주문 응답 데이터:", result);

      if (result.status === "success") {
        Alert.alert(
          "매수 완료",
          result.message || `${stock.name} ${qty}주 매수가 완료되었습니다.`,
          [{ text: "확인", onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert("매수 실패", result.message || "매수 주문에 실패했습니다.");
      }
    } catch (error) {
      console.error("❌ 매수 주문 실패:", error);
      Alert.alert("요청 실패", "매수 주문 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (number) => {
    return number.toLocaleString();
  };

  const getChangeColor = (change) => {
    if (change > 0) return "#F074BA";
    if (change < 0) return "#00BFFF";
    return "#AAAAAA";
  };

  const getChangeSymbol = (change) => {
    if (change > 0) return "▲";
    if (change < 0) return "▼";
    return "";
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
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
          <View style={styles.stockInfo}>
            <Text style={styles.stockName}>{stock?.name || "종목명 없음"}</Text>
            <Text style={styles.stockCode}>
              ({stock?.symbol || "종목코드 없음"})
            </Text>
          </View>

          <View style={styles.priceBlock}>
            {priceLoading ? (
              <ActivityIndicator size="large" color="#F074BA" />
            ) : (
              <>
                <Text style={styles.priceText}>
                  {formatNumber(currentPrice)}원
                </Text>
                {stock?.change !== undefined && (
                  <Text
                    style={[
                      styles.changeText,
                      { color: getChangeColor(stock.change) },
                    ]}
                  >
                    {/* {getChangeSymbol(stock.change)} */}
                    {/* {Math.abs(stock.change).toFixed(2)}% */}
                  </Text>
                )}
              </>
            )}
          </View>
        </View>

        <View style={styles.divider} />

        {/* 현재 보유량 */}
        <View style={styles.infoSection}>
          <Text style={styles.label}>현재 보유량</Text>
          <Text style={styles.value}>
            {formatNumber(stock?.quantity || 0)}주
          </Text>
        </View>

        {/* 수량 입력 */}
        <View style={styles.infoSection}>
          <Text style={styles.label}>매수 수량</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              maxLength={6}
              placeholder="1"
            />
            <Text style={styles.unit}>주</Text>
          </View>
        </View>

        {/* 총 금액 */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>총 매수 금액</Text>
          <Text style={styles.totalAmount}>
            {formatNumber(calculateTotal())}원
          </Text>
        </View>

        {/* 매수 버튼 */}
        <TouchableOpacity
          style={[styles.buyButton, (loading || priceLoading || !userId) && styles.disabledButton]}
          onPress={handleBuy}
          disabled={loading || priceLoading || !userId}
        >
          {loading ? (
            <ActivityIndicator color="#003340" size="large" />
          ) : (
            <Text style={styles.buyButtonText}>
              {formatNumber(parseInt(quantity) || 0)}주 매수하기
            </Text>
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
    paddingHorizontal: 50, // 30 → 50
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 50, // 30 → 50
    paddingTop: 40, // 20 → 40
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 50, // 30 → 50
    marginTop: 60, // 40 → 60
  },
  backText: {
    fontSize: 40, // 36 → 40 (매도화면과 맞춤)
    color: "#F074BA",
    marginRight: 25, // 15 → 25
  },
  title: {
    fontSize: 28, // 32 → 28 (매도화면과 맞춤)
    fontWeight: "bold",
    color: "#F074BA",
    flex: 1,
    textAlign: "center",
    marginRight: 65, // 43 → 65 (매도화면과 맞춤)
  },
  stockRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 35, // 20 → 35
  },
  stockInfo: {
    flex: 1,
  },
  stockName: {
    color: "white",
    fontSize: 26, // 32 → 26 (매도화면과 맞춤)
    fontWeight: "bold",
    marginBottom: 8,
  },
  stockCode: {
    color: "#AFA5CF",
    fontSize: 20, // 24 → 20 (매도화면과 맞춤)
  },
  priceBlock: {
    alignItems: "flex-end",
  },
  priceText: {
    fontSize: 28, // 32 → 28 (매도화면과 맞춤)
    color: "white",
    fontWeight: "bold",
    marginBottom: 8, // 4 → 8
  },
  changeText: {
    fontSize: 20, // 24 → 20 (매도화면과 맞춤)
    fontWeight: "bold",
  },
  divider: {
    height: 2,
    backgroundColor: "#4A5A60",
    marginVertical: 35, // 40 → 35 (매도화면과 맞춤)
  },
  infoSection: {
    marginBottom: 40,
  },
  label: {
    fontSize: 22, // 32 → 22 (매도화면과 맞춤)
    color: "#FFD1EB",
    marginBottom: 15, // 12 → 15 (매도화면과 맞춤)
  },
  value: {
    fontSize: 26, // 28 → 26 (매도화면과 맞춤)
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15, // 10 → 15 (매도화면과 맞춤)
    paddingHorizontal: 25, // 15 → 25 (매도화면과 맞춤)
    paddingVertical: 20, // 12 → 20 (매도화면과 맞춤)
    fontSize: 26, // 24 → 26 (매도화면과 맞춤)
    color: "#000000",
    minWidth: 150, // 100 → 150 (매도화면과 맞춤)
    textAlign: "center",
    marginRight: 15, // 10 → 15 (매도화면과 맞춤)
  },
  unit: {
    fontSize: 26, // 32 → 26 (매도화면과 맞춤)
    color: "#FFFFFF",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 40, // 30 → 40 (매도화면과 맞춤)
    marginBottom: 25, // 40 → 25 (매도화면과 맞춤)
    paddingVertical: 25, // 35 → 25 (매도화면과 맞춤)
    paddingHorizontal: 35, // 30 → 35 (매도화면과 맞춤)
    backgroundColor: "#004455",
    borderRadius: 15, // 10 → 15 (매도화면과 맞춤)
  },
  totalLabel: {
    fontSize: 24, // 28 → 24 (매도화면과 맞춤)
    color: "#FFFFFF",
  },
  totalAmount: {
    fontSize: 28, // 36 → 28 (매도화면과 맞춤)
    fontWeight: "bold",
    color: "#6EE69E",
  },
  buyButton: {
    marginTop: "auto",
    backgroundColor: "#6EE69E",
    borderRadius: 20, // 16 → 20 (매도화면과 맞춤)
    paddingVertical: 25, // 28 → 25 (매도화면과 맞춤)
    alignItems: "center",
    marginBottom: 50, // 30 → 50 (매도화면과 맞춤)
  },
  disabledButton: {
    backgroundColor: "#A0A0A0",
  },
  buyButtonText: {
    fontSize: 26, // 36 → 26 (매도화면과 맞춤)
    fontWeight: "bold",
    color: "#003340",
  },
});

export default TradingBuyScreen;