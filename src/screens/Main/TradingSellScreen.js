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
import { fetchWithHantuToken } from "../../utils/hantuToken";

const TradingSellScreen = ({ route, navigation }) => {
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

      const result = await fetchWithHantuToken(`${API_BASE_URL}trading/stock_price/?stock_code=${stockCode}`);

      if (!result.success) {
        throw new Error(result.error);
      }

      const data = result.data;

      if (data.current_price) {
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

  const handleSell = async () => {
    console.log("💸 매도 주문 시작");

    if (!stock || !stock.name) {
      Alert.alert("오류", "주식 정보가 올바르지 않습니다.");
      return;
    }

    const qty = parseInt(quantity);
    if (!qty || qty <= 0) {
      Alert.alert("오류", "올바른 수량을 입력해주세요.");
      return;
    }

    const ownedQty = parseInt(stock.quantity) || 0;
    if (qty > ownedQty) {
      Alert.alert(
        "매도 실패",
        `보유 수량(${ownedQty}주)보다 많이 매도할 수 없습니다.`
      );
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
        order_type: "sell",
        quantity: qty,
        price: currentPrice,
      };

      console.log("📡 매도 주문 데이터:", orderData);

      const response = await fetchWithHantuToken(
        `${API_BASE_URL}trading/trade/`,
        {
          method: "POST",
          body: JSON.stringify(orderData),
        },
        navigation
      );

      const result = response.data;
      console.log("📬 매도 주문 응답:", result);

      if (response.success && result?.status === "success") {
        Alert.alert(
          "매도 완료",
          result.message || `${stock.name} ${qty}주 매도가 완료되었습니다.`,
          [{ text: "확인", onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert(
          "매도 실패",
          result?.message || `오류가 발생했습니다. (${response.status})`
        );
      }
    } catch (error) {
      console.error("❌ 매도 주문 실패:", error);
      Alert.alert("요청 실패", "매도 주문 중 문제가 발생했습니다.");
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

  const maxSellQuantity = parseInt(stock?.quantity) || 0;

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
          <Text style={styles.title}>매도</Text>
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
          <Text style={styles.value}>{formatNumber(maxSellQuantity)}주</Text>
        </View>

        {/* 평균 단가 정보 */}
        {stock?.average_price && (
          <View style={styles.infoSection}>
            <Text style={styles.label}>평균 단가</Text>
            <Text style={styles.value}>
              {formatNumber(stock.average_price)}원
            </Text>
          </View>
        )}

        {/* 수량 입력 */}
        <View style={styles.infoSection}>
          <Text style={styles.label}>매도 수량</Text>
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
            <TouchableOpacity
              style={styles.maxButton}
              onPress={() => setQuantity(maxSellQuantity.toString())}
            >
              <Text style={styles.maxButtonText}>전체</Text>
            </TouchableOpacity>
          </View>
          {maxSellQuantity > 0 && (
            <Text style={styles.maxInfo}>
              최대 {formatNumber(maxSellQuantity)}주까지 매도 가능
            </Text>
          )}
        </View>

        {/* 총 금액 */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>총 매도 금액</Text>
          <Text style={styles.totalAmount}>
            {formatNumber(calculateTotal())}원
          </Text>
        </View>

        {/* 예상 손익 */}
        {stock?.average_price && (
          <View style={styles.profitRow}>
            <Text style={styles.profitLabel}>예상 손익</Text>
            <Text
              style={[
                styles.profitAmount,
                {
                  color:
                    currentPrice - stock.average_price >= 0
                      ? "#6EE69E"
                      : "#F074BA",
                },
              ]}
            >
              {currentPrice - stock.average_price >= 0 ? "+" : ""}
              {formatNumber(
                (currentPrice - stock.average_price) * (parseInt(quantity) || 0)
              )}
              원
            </Text>
          </View>
        )}

        {/* 매도 버튼 */}
        <TouchableOpacity
          style={[
            styles.sellButton,
            (loading || priceLoading || maxSellQuantity === 0) &&
              styles.disabledButton,
          ]}
          onPress={handleSell}
          disabled={loading || priceLoading || maxSellQuantity === 0}
        >
          {loading ? (
            <ActivityIndicator color="#003340" />
          ) : maxSellQuantity === 0 ? (
            <Text style={styles.sellButtonText}>매도할 주식이 없습니다</Text>
          ) : (
            <Text style={styles.sellButtonText}>
              {formatNumber(parseInt(quantity) || 0)}주 매도하기
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
    paddingHorizontal: 30,
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
    marginRight: 10,
  },
  maxButton: {
    backgroundColor: "#4A5A60",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  maxButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  maxInfo: {
    fontSize: 12,
    color: "#AFA5CF",
    marginTop: 5,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 15,
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
    color: "#F074BA",
  },
  profitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#002A35",
    borderRadius: 10,
  },
  profitLabel: {
    fontSize: 14,
    color: "#FFFFFF",
  },
  profitAmount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  sellButton: {
    marginTop: "auto",
    backgroundColor: "#F074BA",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 30,
  },
  disabledButton: {
    backgroundColor: "#A0A0A0",
  },
  sellButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#003340",
  },
});

export default TradingSellScreen;
