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
import { fetchPortfolio } from "../../utils/portfolio";
import { API_BASE_URL } from "../../utils/apiConfig";

const TradingSellScreen = ({ route, navigation }) => {
  const stock = route.params?.stock;
  const [portfolioData, setPortfolioData] = useState([]);
  const [quantity, setQuantity] = useState("1");
  const [currentPrice, setCurrentPrice] = useState(stock?.price || 0);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      console.log("📥 다시 focus됨: 포트폴리오 재요청");
      fetchPortfolio(navigation, setPortfolioData, setLoading);
    });

    return unsubscribe;
  }, [navigation]);

  const handleSell = async () => {
    const sellQty = parseInt(quantity);
    const ownedQty = parseInt(stock.quantity);

    if (sellQty > ownedQty) {
      Alert.alert("❌ 매도 실패", "보유 수량보다 많이 매도할 수 없습니다.");
      return;
    }

    setLoading(true);
    try {
      const accessToken = await getNewAccessToken(navigation);
      if (!accessToken || !userId) {
        Alert.alert("오류", "사용자 인증에 실패했습니다.");
        return;
      }

      const postData = {
        user_id: userId,
        stock_symbol: stock.name,
        order_type: "sell",
        quantity: sellQty,
        price: parsedPrice,
      };

      const response = await fetch(`${API_BASE_URL}trading/trade/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      const result = await response.json();
      if (response.ok && result?.status === "success") {
        Alert.alert("매도 성공", result.message);
        navigation.goBack();
      } else {
        Alert.alert("❌ 매도 실패", result?.message || "오류 발생");
      }
    } catch (error) {
      console.error("❌ 매도 오류:", error);
      Alert.alert("❌ 요청 실패", "매도 중 문제가 발생했습니다.");
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
          <Text style={styles.title}>매도</Text>
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
          얼마나 매도할까요?
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
          <Text style={styles.totalAmount}>+{total.toLocaleString()}원</Text>
        </View>

        {/* 매도 버튼 */}
        <TouchableOpacity
          style={styles.sellButton}
          onPress={handleSell}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#003340" />
          ) : (
            <Text style={styles.sellButtonText}>매도하기</Text>
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

  sellButton: {
    marginTop: "auto",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 20,
  },
  sellButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#003340",
  },
});

export default TradingSellScreen;
