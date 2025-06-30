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
      await fetchCurrentPrice();
    };
    init();
  }, []);

  const fetchCurrentPrice = async () => {
    if (!stock?.symbol) {
      console.error("❌ 종목 코드가 없습니다.");
      setPriceLoading(false);
      return;
    }

    try {
      setPriceLoading(true);

      const response = await fetch(
        `${API_BASE_URL}trading/stock_price/?stock_code=${stock.symbol}`
      );

      if (!response.ok) {
        throw new Error(`Price API error: ${response.status}`);
      }

      const result = await response.json();

      if (result.status === "success" && result.current_price) {
        setCurrentPrice(result.current_price);
        console.log("✅ 현재가 업데이트:", result.current_price);
      } else {
        console.warn("⚠️ 현재가 API 응답 실패:", result);
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
      const accessToken = await getNewAccessToken(navigation);
      if (!accessToken || !userId) {
        Alert.alert("오류", "사용자 인증에 실패했습니다.");
        return;
      }

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

      const response = await fetch(`${API_BASE_URL}trading/trade/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();
      console.log("📬 매수 주문 응답:", result);

      if (response.ok && result?.status === "success") {
        Alert.alert(
          "매수 완료",
          result.message || `${stock.name} ${qty}주 매수가 완료되었습니다.`,
          [{ text: "확인", onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert(
          "매수 실패",
          result?.message || `오류가 발생했습니다. (${response.status})`
        );
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
          <View style={styles.stockInfo}>
            <Text style={styles.stockName}>{stock?.name || "종목명 없음"}</Text>
            <Text style={styles.stockCode}>
              ({stock?.symbol || "종목코드 없음"})
            </Text>
          </View>

          <View style={styles.priceBlock}>
            {priceLoading ? (
              <ActivityIndicator size="small" color="#F074BA" />
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
                    {getChangeSymbol(stock.change)}
                    {Math.abs(stock.change).toFixed(2)}%
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
          style={[styles.buyButton, loading && styles.disabledButton]}
          onPress={handleBuy}
          disabled={loading || priceLoading}
        >
          {loading ? (
            <ActivityIndicator color="#003340" />
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
    paddingHorizontal: 30,
    backgroundColor: "#003340",
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
    marginTop: 40,
  },
  backText: {
    fontSize: 28,
    color: "#F074BA",
    marginRight: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#F074BA",
    flex: 1,
    textAlign: "center",
    marginRight: 43, // 뒤로가기 버튼 공간만큼 보정
  },
  stockRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  stockInfo: {
    flex: 1,
  },
  stockName: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  stockCode: {
    color: "#AFA5CF",
    fontSize: 14,
  },
  priceBlock: {
    alignItems: "flex-end",
  },
  priceText: {
    fontSize: 20,
    color: "white",
    fontWeight: "bold",
    marginBottom: 4,
  },
  changeText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  divider: {
    height: 1,
    backgroundColor: "#4A5A60",
    marginVertical: 20,
  },
  infoSection: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    color: "#FFD1EB",
    marginBottom: 8,
  },
  value: {
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 18,
    color: "#000000",
    minWidth: 100,
    textAlign: "center",
    marginRight: 10,
  },
  unit: {
    fontSize: 18,
    color: "#FFFFFF",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 30,
    marginBottom: 40,
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: "#004455",
    borderRadius: 10,
  },
  totalLabel: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6EE69E",
  },
  buyButton: {
    marginTop: "auto",
    backgroundColor: "#6EE69E",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 30,
  },
  disabledButton: {
    backgroundColor: "#A0A0A0",
  },
  buyButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#003340",
  },
});

export default TradingBuyScreen;
