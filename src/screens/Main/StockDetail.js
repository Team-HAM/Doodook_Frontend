import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { API_BASE_URL } from "../../utils/apiConfig";

const screenWidth = Dimensions.get("window").width;

const StockDetail = ({ route, navigation }) => {
  const { symbol, name } = route.params;
  const [loading, setLoading] = useState(true);
  const [stockData, setStockData] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);

  // 차트 관련 state
  const [chartData, setChartData] = useState(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("1M"); // 1M, 3M, 6M

  // 차트 포인트 클릭 관련 state
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // 한국투자 토큰 생성 및 주식 상세 정보 가져오는부분
  useEffect(() => {
    const fetchStockDetails = async () => {
      try {
        setLoading(true);

        // 1. 기존 토큰 삭제
        await fetch(
          `${API_BASE_URL}trade_hantu/destroy_access_token/`,
          {
            method: "POST",
          }
        );

        // 2. 새 토큰 생성
        await fetch(
          `${API_BASE_URL}trade_hantu/issue_access_token/`,
          {
            method: "POST",
          }
        );

        // 3. 현재가 조회
        const priceResponse = await fetch(
          `${API_BASE_URL}trading/stock_price/?stock_code=${symbol}`
        );
        const priceData = await priceResponse.json();

        // 4. 전일대비 변동 정보 조회
        const changeResponse = await fetch(
          `${API_BASE_URL}stocks/price_change/?stock_code=${symbol}`
        );
        const changeData = await changeResponse.json();

        // 데이터 설정
        if (priceData.status === "success" && changeData.status === "success") {
          // 상승/하락 부호 추가
          const changeSign =
            changeData.change_status === "up"
              ? " ⏶ "
              : changeData.change_status === "down"
              ? " ⏷ "
              : "";

          const priceChangeSign =
            changeData.change_status === "up"
              ? "+"
              : changeData.change_status === "down"
              ? "-"
              : "";

          setStockData({
            symbol: symbol,
            name: name,
            price: priceData.current_price.toLocaleString(),
            change: `${changeSign}${Math.abs(
              changeData.price_change_percentage
            ).toFixed(2)}`,
            changeStatus: changeData.change_status,
            priceChange: `${priceChangeSign}${Math.abs(
              changeData.price_change
            ).toLocaleString()}`,
            previousPrice: changeData.previous_price.toLocaleString(),
            currentDate: changeData.current_date,
            previousDate: changeData.previous_date,
          });
        } else {
          // API 오류 시 임시 데이터 설정
          setStockData({
            symbol: symbol,
            name: name,
            price: "0",
            change: "0.00",
            changeStatus: "none",
            priceChange: "0",
            previousPrice: "0",
            currentDate: "",
            previousDate: "",
          });
        }
      } catch (error) {
        console.error("주식 상세 정보 불러오기 실패:", error);
        // 오류 시 임시 데이터
        setStockData({
          symbol: symbol,
          name: name,
          price: "0",
          change: "0.00",
          changeStatus: "none",
          priceChange: "0",
          previousPrice: "0",
          currentDate: "",
          previousDate: "",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStockDetails();
  }, [symbol]);

  // 일봉 데이터 가져오기
  const fetchChartData = async (period) => {
    setChartLoading(true);
    try {
      // 기간별 날짜 계산
      const endDate = new Date();
      const startDate = new Date();

      switch (period) {
        case "1M":
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case "3M":
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case "6M":
          startDate.setMonth(endDate.getMonth() - 6);
          break;
        default:
          startDate.setMonth(endDate.getMonth() - 1);
      }

      const formatDate = (date) => {
        return (
          date.getFullYear() +
          String(date.getMonth() + 1).padStart(2, "0") +
          String(date.getDate()).padStart(2, "0")
        );
      };

      const startDateStr = formatDate(startDate);
      const endDateStr = formatDate(endDate);

      console.log(
        `📊 일봉 데이터 요청: ${symbol}, ${startDateStr} ~ ${endDateStr}`
      );

      const response = await fetch(
        `${API_BASE_URL}stocks/daily_stock_price/?stock_code=${symbol}&start_date=${startDateStr}&end_date=${endDateStr}`
      );

      const data = await response.json();
      console.log("📊 일봉 응답:", data);

      // fetchChartData 함수 내부의 데이터 처리 부분만 변경
      if (data.status === "success" && data.chart_data) {
        // 데이터를 차트에 맞게 변환
        const sortedData = data.chart_data.sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        );

        // 최대 표시할 점의 개수 설정 (1개월 뷰와 유사한 수준)
        const maxDataPoints = 25; // 1개월은 보통 20-30개 정도
        const dataInterval = Math.max(
          1,
          Math.ceil(sortedData.length / maxDataPoints)
        );

        // 데이터 샘플링: 일정 간격으로 데이터 선택
        const sampledData = sortedData.filter(
          (_, index) => index % dataInterval === 0
        );

        // 마지막 데이터는 항상 포함 (최신 정보)
        if (
          sortedData.length > 0 &&
          sampledData[sampledData.length - 1] !==
            sortedData[sortedData.length - 1]
        ) {
          sampledData.push(sortedData[sortedData.length - 1]);
        }

        const labels = sampledData.map((item) => {
          const date = new Date(item.date);
          return `${date.getMonth() + 1}/${date.getDate()}`;
        });

        const prices = sampledData.map((item) => item.close);

        // x축 레이블 개수 조정 (너무 많으면 겹치므로)
        const maxLabelCount = 8;
        const labelInterval = Math.max(
          1,
          Math.ceil(labels.length / maxLabelCount)
        );
        const displayLabels = labels.map((label, index) =>
          index % labelInterval === 0 ? label : ""
        );

        setChartData({
          labels: displayLabels,
          datasets: [
            {
              data: prices,
              color: (opacity = 1) =>
                stockData?.changeStatus === "up"
                  ? `rgba(240, 116, 186, ${opacity})`
                  : stockData?.changeStatus === "down"
                  ? `rgba(96, 165, 250, ${opacity})`
                  : `rgba(156, 163, 175, ${opacity})`,
              strokeWidth: 2,
            },
          ],
          rawData: sampledData, // 샘플링된 데이터 보관
          yAxisSegments: 6, // y축 세그먼트는 고정으로 6개
        });
      } else {
        console.warn("일봉 데이터를 불러올 수 없습니다:", data);
        setChartData(null);
      }
    } catch (error) {
      console.error("일봉 데이터 요청 실패:", error);
      setChartData(null);
    } finally {
      setChartLoading(false);
    }
  };

  // 선택된 기간이 변경될 때마다 차트 데이터 새로 불러오기
  useEffect(() => {
    if (stockData) {
      fetchChartData(selectedPeriod);
    }
  }, [selectedPeriod, stockData]);

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // 즐겨찾기 관련 -> 이거 구현되면 추가할예정
  };

  // 매수 버튼 핸들러
  const handleBuyPress = () => {
    // TradingBuyScreen에서 요구하는 stock 객체 형태로 생성
    const stock = {
      name: stockData.name,
      price: stockData.price,
      change: stockData.change,
      symbol: stockData.symbol,
      quantity: 0, // 새로 매수하는 경우이므로 0으로 설정
    };

    navigation.navigate("TradingBuy", { stock });
  };

  // 매도 버튼 핸들러
  const handleSellPress = () => {
    // TradingSellScreen에서 요구하는 stock 객체 형태로 생성
    const stock = {
      name: stockData.name,
      price: stockData.price,
      change: stockData.change,
      symbol: stockData.symbol,
      quantity: 0, // 실제로는 보유 수량을 조회해야 하지만, 일단 0으로 설정
    };

    navigation.navigate("TradingSell", { stock });
  };

  // 차트 포인트 클릭 핸들러
  const handleDataPointClick = (data) => {
    if (chartData && chartData.rawData && data.index !== undefined) {
      const pointData = chartData.rawData[data.index];
      if (pointData) {
        const date = new Date(pointData.date);
        const formattedDate = `${date.getFullYear()}년 ${
          date.getMonth() + 1
        }월 ${date.getDate()}일`;

        setSelectedPoint({
          date: formattedDate,
          price: pointData.close.toLocaleString(),
          x: data.x,
          y: data.y,
        });
        setModalVisible(true);
      }
    }
  };

  // 모달 닫기
  const closeModal = () => {
    setModalVisible(false);
    setSelectedPoint(null);
  };

  // 기간 선택 버튼 렌더링
  const renderPeriodButtons = () => {
    const periods = [
      { key: "1M", label: "1개월" },
      { key: "3M", label: "3개월" },
      { key: "6M", label: "6개월" },
    ];

    return (
      <View style={styles.periodButtonContainer}>
        {periods.map((period) => (
          <TouchableOpacity
            key={period.key}
            style={[
              styles.periodButton,
              selectedPeriod === period.key && styles.selectedPeriodButton,
            ]}
            onPress={() => setSelectedPeriod(period.key)}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === period.key &&
                  styles.selectedPeriodButtonText,
              ]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // 차트 렌더링
  const renderChart = () => {
    if (chartLoading) {
      return (
        <View style={styles.chartLoadingContainer}>
          <ActivityIndicator size="large" color="#F074BA" />
          <Text style={styles.chartLoadingText}>차트 로딩 중...</Text>
        </View>
      );
    }

    if (!chartData || !chartData.datasets[0].data.length) {
      return (
        <View style={styles.chartPlaceholder}>
          <Text style={styles.chartText}>차트 데이터를 불러올 수 없습니다</Text>
        </View>
      );
    }

    return (
      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          width={screenWidth - 32}
          height={200}
          chartConfig={{
            backgroundColor: "#004455",
            backgroundGradientFrom: "#004455",
            backgroundGradientTo: "#004455",
            decimalPlaces: 0,
            color: (opacity = 1) =>
              stockData?.changeStatus === "up"
                ? `rgba(240, 116, 186, ${opacity})`
                : stockData?.changeStatus === "down"
                ? `rgba(96, 165, 250, ${opacity})`
                : `rgba(156, 163, 175, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(239, 241, 245, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: "4",
              strokeWidth: "2",
              stroke:
                stockData?.changeStatus === "up"
                  ? "#F074BA"
                  : stockData?.changeStatus === "down"
                  ? "#60a5fa"
                  : "#9ca3af",
            },
          }}
          bezier
          style={styles.chart}
          withInnerLines={false}
          withOuterLines={false}
          withVerticalLines={false}
          withHorizontalLines={true}
          segments={chartData.yAxisSegments || 4}
          onDataPointClick={handleDataPointClick}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F074BA" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* 🔙 뒤로 가기 버튼 */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{name}</Text>
        <TouchableOpacity
          onPress={toggleFavorite}
          style={styles.favoriteButton}
        >
          {isFavorite ? (
            <Text style={styles.starIcon}>★</Text>
          ) : (
            <Text style={styles.starIcon}>☆</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.priceSection}>
          <Text style={styles.symbolText}>{symbol}</Text>
          <Text style={styles.priceText}>{stockData.price}원</Text>
          <Text
            style={[
              styles.changeText,
              stockData.changeStatus === "up"
                ? styles.positiveChange
                : stockData.changeStatus === "down"
                ? styles.negativeChange
                : styles.neutralChange,
            ]}
          >
            {stockData.change}% ({stockData.priceChange}원)
          </Text>
        </View>

        {/* 차트 섹션 */}
        <View style={styles.chartSection}>
          {renderPeriodButtons()}
          {renderChart()}
        </View>

        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>주요 지표</Text>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>
              전일 종가 ({stockData.previousDate})
            </Text>
            <Text style={styles.statValue}>{stockData.previousPrice}원</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>
              현재가 ({stockData.currentDate})
            </Text>
            <Text style={styles.statValue}>{stockData.price}원</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>전일대비 변동</Text>
            <Text
              style={[
                styles.statValue,
                stockData.changeStatus === "up"
                  ? styles.positiveChange
                  : stockData.changeStatus === "down"
                  ? styles.negativeChange
                  : null,
              ]}
            >
              {stockData.change}% ({stockData.priceChange}원)
            </Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>거래량</Text>
            <Text style={styles.statValue}>{stockData.volume}</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>시가총액</Text>
            <Text style={styles.statValue}>{stockData.marketCap}</Text>
          </View>
        </View>

        {/* 매수/매도 버튼 컨테이너 */}
        <View style={styles.tradeButtonContainer}>
          <TouchableOpacity style={styles.buyButton} onPress={handleBuyPress}>
            <Text style={styles.buyButtonText}>매수</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sellButton} onPress={handleSellPress}>
            <Text style={styles.sellButtonText}>매도</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 차트 포인트 클릭 모달 */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                {selectedPoint && (
                  <>
                    <Text style={styles.modalDate}>{selectedPoint.date}</Text>
                    <Text style={styles.modalPrice}>
                      {selectedPoint.price}원
                    </Text>
                    <TouchableOpacity
                      style={styles.modalCloseButton}
                      onPress={closeModal}
                    >
                      <Text style={styles.modalCloseText}>확인</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#003340",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#003340",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    marginTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: "#004455",
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: "#EFF1F5",
    fontSize: 24,
    fontWeight: "bold",
  },
  headerTitle: {
    color: "#EFF1F5",
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  favoriteButton: {
    padding: 8,
  },
  starIcon: {
    width: 24,
    height: 24,
    color: "#F074BA",
    fontSize: 24,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  priceSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  symbolText: {
    color: "#9ca3af",
    fontSize: 14,
    marginBottom: 8,
  },
  priceText: {
    color: "#EFF1F5",
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 8,
  },
  changeText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  positiveChange: {
    color: "#F074BA",
  },
  negativeChange: {
    color: "#60a5fa",
  },
  neutralChange: {
    color: "#9ca3af",
  },
  // 차트 관련 스타일
  chartSection: {
    marginBottom: 24,
  },
  periodButtonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
    backgroundColor: "#004455",
    borderRadius: 20,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  selectedPeriodButton: {
    backgroundColor: "#F074BA",
  },
  periodButtonText: {
    color: "#9ca3af",
    fontSize: 14,
    fontWeight: "500",
  },
  selectedPeriodButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  chartContainer: {
    alignItems: "center",
    backgroundColor: "#004455",
    borderRadius: 16,
    padding: 8,
  },
  chart: {
    borderRadius: 16,
  },
  chartLoadingContainer: {
    height: 200,
    backgroundColor: "#004455",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  chartLoadingText: {
    color: "#9ca3af",
    marginTop: 10,
  },
  chartPlaceholder: {
    height: 200,
    backgroundColor: "#004455",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  chartText: {
    color: "#9ca3af",
  },
  statsContainer: {
    backgroundColor: "#004455",
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#F074BA",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#003340",
  },
  statLabel: {
    color: "#9ca3af",
    fontSize: 14,
  },
  statValue: {
    color: "#EFF1F5",
    fontSize: 14,
    fontWeight: "500",
  },
  // 매수/매도 버튼 스타일
  tradeButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 32,
  },
  buyButton: {
    flex: 1,
    backgroundColor: "#6EE69E",
    padding: 16,
    borderRadius: 13,
    alignItems: "center",
    marginLeft: 10,
    marginRight: 4,
  },
  buyButtonText: {
    color: "#003340",
    fontSize: 20,
    fontWeight: "900",
  },
  sellButton: {
    flex: 1,
    backgroundColor: "#F074BA",
    padding: 16,
    borderRadius: 13,
    alignItems: "center",
    marginRight: 10,
    marginLeft: 4,
  },
  sellButtonText: {
    color: "#003340",
    fontSize: 20,
    fontWeight: "900",
  },
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#004455",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    minWidth: 200,
    //borderWidth: 1,
    //borderColor: "#F074BA",
  },
  modalDate: {
    color: "#EFF1F5",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  modalPrice: {
    color: "#EFF1F5",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  modalCloseButton: {
    backgroundColor: "#EFF1F5",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalCloseText: {
    color: "#003340",
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default StockDetail;
