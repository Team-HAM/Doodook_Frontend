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
import { fetchUserInfo } from "../../utils/user";
import { API_BASE_URL } from "../../utils/apiConfig";
import { fetchWithHantuToken } from "../../utils/hantuToken";
// ⬇️ 변경: getNewAccessToken 제거, fetchWithAuth 추가
import { fetchWithAuth } from "../../utils/token";

const TradingSellScreen = ({ route, navigation }) => {
  const stock = route.params?.stock;
  const [quantity, setQuantity] = useState("1");
  const [currentPrice, setCurrentPrice] = useState(0);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [priceLoading, setPriceLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await fetchUserInfo(navigation, (info) => {
        if (info?.id) setUserId(info.id);
      });
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
      if (!result.success) throw new Error(result.error);
      const data = result.data;
      if (data.current_price) {
        setCurrentPrice(data.current_price);
      } else {
        setCurrentPrice(
          typeof stock.price === "string"
            ? parseInt(stock.price.replace(/,/g, ""))
            : stock.price
        );
      }
    } catch (e) {
      console.error("❌ 현재가 조회 실패:", e);
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

    // ⬇️ 추가: userId 없으면 차단
    if (!userId) {
      Alert.alert("오류", "사용자 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

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
      // ⬇️ 변경: 서버가 코드만 받으므로 symbol 고정
      const stockIdentifier = stock.symbol;

      const orderData = {
        user_id: userId,
        stock_symbol: stockIdentifier,
        order_type: "sell",
        quantity: qty,
        price: currentPrice,
      };

      console.log("📡 매도 주문 데이터:", orderData);

      // ⬇️ 변경: Content-Type 명시
      const response = await fetchWithAuth(
        `${API_BASE_URL}trading/trade/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderData),
        },
        navigation
      );

      console.log("📬 매도 주문 응답 상태:", response.status);

      const text = await response.text();
      let result;
      try { result = JSON.parse(text); } catch { result = { message: text }; }
      console.log("📬 매도 주문 응답 데이터:", result);

      if (!response.ok) {
        console.error("❌ 매도 주문 실패 응답:", result);
        Alert.alert("매도 실패", result?.detail || result?.message || `서버 오류: ${response.status}`);
        return;
      }

      if (result.status === "success") {
        Alert.alert(
          "매도 완료",
          result.message || `${stock.name} ${qty}주 매도가 완료되었습니다.`,
          [{ text: "확인", onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert("매도 실패", result.message || "매도 주문에 실패했습니다.");
      }
    } catch (error) {
      console.error("❌ 매도 주문 실패:", error);
      Alert.alert("요청 실패", "매도 주문 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (number) => number.toLocaleString();
  const getChangeColor = (change) => (change > 0 ? "#F074BA" : change < 0 ? "#00BFFF" : "#AAAAAA");
  const getChangeSymbol = (change) => (change > 0 ? "▲" : change < 0 ? "▼" : "");

  const maxSellQuantity = parseInt(stock?.quantity) || 0;

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
          <Text style={styles.title}>매도</Text>
        </View>

        {/* 종목 정보 */}
        <View style={styles.stockRow}>
          <View style={styles.stockInfo}>
            <Text style={styles.stockName}>{stock?.name || "종목명 없음"}</Text>
            <Text style={styles.stockCode}>({stock?.symbol || "종목코드 없음"})</Text>
          </View>

          <View style={styles.priceBlock}>
            {priceLoading ? (
              <ActivityIndicator size="large" color="#F074BA" />
            ) : (
              <>
                <Text style={styles.priceText}>{formatNumber(currentPrice)}원</Text>
                {stock?.change !== undefined && (
                  <Text style={[styles.changeText, { color: getChangeColor(stock.change) }]}>
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
          <Text style={styles.value}>{formatNumber(maxSellQuantity)}주</Text>
        </View>

        {/* 평균 단가 정보 */}
        {stock?.average_price && (
          <View style={styles.infoSection}>
            <Text style={styles.label}>평균 단가</Text>
            <Text style={styles.value}>{formatNumber(stock.average_price)}원</Text>
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
            <Text style={styles.maxInfo}>최대 {formatNumber(maxSellQuantity)}주까지 매도 가능</Text>
          )}
        </View>

        {/* 총 금액 */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>총 매도 금액</Text>
          <Text style={styles.totalAmount}>{formatNumber(calculateTotal())}원</Text>
        </View>

        {/* 예상 손익 */}
        {stock?.average_price && (
          <View style={styles.profitRow}>
            <Text style={styles.profitLabel}>예상 손익</Text>
            <Text
              style={[
                styles.profitAmount,
                { color: currentPrice - stock.average_price >= 0 ? "#6EE69E" : "#F074BA" },
              ]}
            >
              {currentPrice - stock.average_price >= 0 ? "+" : ""}
              {formatNumber((currentPrice - stock.average_price) * (parseInt(quantity) || 0))}원
            </Text>
          </View>
        )}

        {/* 매도 버튼 */}
        <TouchableOpacity
          style={[
            styles.sellButton,
            (loading || priceLoading || maxSellQuantity === 0 || !userId) && styles.disabledButton,
          ]}
          onPress={handleSell}
          disabled={loading || priceLoading || maxSellQuantity === 0 || !userId}
        >
          {loading ? (
            <ActivityIndicator color="#003340" size="large" />
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
    paddingHorizontal: 50 // 30 → 50
  },
  safeArea: { 
    flex: 1, 
    paddingHorizontal: 50, // 30 → 50
    paddingTop: 40 // 20 → 40
  },
  header: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 50, // 30 → 50
    marginTop: 60 // 40 → 60
  },
  backText: { 
    fontSize: 40, // 28 → 40
    color: "#F074BA", 
    marginRight: 25 // 15 → 25
  },
  title: { 
    fontSize: 28, // 20 → 28
    fontWeight: "bold", 
    color: "#F074BA", 
    flex: 1, 
    textAlign: "center", 
    marginRight: 65 // 43 → 65
  },
  stockRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: 35 // 20 → 35
  },
  stockInfo: { flex: 1 },
  stockName: { 
    color: "white", 
    fontSize: 26, // 18 → 26
    fontWeight: "bold", 
    marginBottom: 8 // 4 → 8
  },
  stockCode: { 
    color: "#AFA5CF", 
    fontSize: 20 // 14 → 20
  },
  priceBlock: { alignItems: "flex-end" },
  priceText: { 
    fontSize: 28, // 20 → 28
    color: "white", 
    fontWeight: "bold", 
    marginBottom: 8 // 4 → 8
  },
  changeText: { 
    fontSize: 20, // 14 → 20
    fontWeight: "bold" 
  },
  divider: { 
    height: 2, // 1 → 2
    backgroundColor: "#4A5A60", 
    marginVertical: 35 // 20 → 35
  },
  infoSection: { 
    marginBottom: 40 // 25 → 40
  },
  label: { 
    fontSize: 22, // 16 → 22
    color: "#FFD1EB", 
    marginBottom: 15 // 8 → 15
  },
  value: { 
    fontSize: 26, // 18 → 26
    color: "#FFFFFF", 
    fontWeight: "bold" 
  },
  inputRow: { 
    flexDirection: "row", 
    alignItems: "center" 
  },
  input: { 
    backgroundColor: "#FFFFFF", 
    borderRadius: 15, // 10 → 15
    paddingHorizontal: 25, // 15 → 25
    paddingVertical: 20, // 12 → 20
    fontSize: 26, // 18 → 26
    color: "#000000", 
    minWidth: 150, // 100 → 150
    textAlign: "center", 
    marginRight: 15 // 10 → 15
  },
  unit: { 
    fontSize: 26, // 18 → 26
    color: "#FFFFFF", 
    marginRight: 20 // 10 → 20
  },
  maxButton: { 
    backgroundColor: "#4A5A60", 
    paddingHorizontal: 20, // 12 → 20
    paddingVertical: 15, // 8 → 15
    borderRadius: 10 // 6 → 10
  },
  maxButtonText: { 
    color: "#FFFFFF", 
    fontSize: 20, // 14 → 20
    fontWeight: "bold" 
  },
  maxInfo: { 
    fontSize: 18, // 12 → 18
    color: "#AFA5CF", 
    marginTop: 10 // 5 → 10
  },
  totalRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginTop: 40, // 20 → 40
    marginBottom: 25, // 15 → 25
    paddingVertical: 25, // 15 → 25
    paddingHorizontal: 35, // 20 → 35
    backgroundColor: "#004455", 
    borderRadius: 15 // 10 → 15
  },
  totalLabel: { 
    fontSize: 24, // 16 → 24
    color: "#FFFFFF" 
  },
  totalAmount: { 
    fontSize: 28, // 20 → 28
    fontWeight: "bold", 
    color: "#F074BA" 
  },
  profitRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: 50, // 30 → 50
    paddingVertical: 20, // 12 → 20
    paddingHorizontal: 35, // 20 → 35
    backgroundColor: "#002A35", 
    borderRadius: 15 // 10 → 15
  },
  profitLabel: { 
    fontSize: 20, // 14 → 20
    color: "#FFFFFF" 
  },
  profitAmount: { 
    fontSize: 24, // 16 → 24
    fontWeight: "bold" 
  },
  sellButton: { 
    marginTop: "auto", 
    backgroundColor: "#F074BA", 
    borderRadius: 20, // 12 → 20
    paddingVertical: 25, // 16 → 25
    alignItems: "center", 
    marginBottom: 50 // 30 → 50
  },
  disabledButton: { 
    backgroundColor: "#A0A0A0" 
  },
  sellButtonText: { 
    fontSize: 26, // 18 → 26
    fontWeight: "bold", 
    color: "#003340" 
  },
});

export default TradingSellScreen;