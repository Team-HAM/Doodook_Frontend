import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchUserBalance } from "../../utils/account";
import { fetchUserInfo } from "../../utils/user";
import { fetchWatchlist, removeFromWatchlist, addToWatchlist } from "../../utils/watchList";

import { PieChart } from "react-native-chart-kit";
import { API_BASE_URL } from "../../utils/apiConfig";
import { getNewAccessToken } from "../../utils/token";
import { fetchWithHantuToken } from "../../utils/hantuToken";
import {
  initializeHantuToken,
  scheduleTokenRefresh,
} from "../../utils/hantuToken";

import BellIcon from "../../assets/icons/bell.svg";
import SearchIcon from "../../assets/icons/search.svg";

const screenWidth = Dimensions.get("window").width;

const MainScreen = ({ navigation }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [watchlist, setWatchlist] = useState([]); // 빈 배열로 초기화
  const [balance, setBalance] = useState("0원");
  const [refreshing, setRefreshing] = useState(false); // 새로고침 상태

  // 자산 데이터 상태
  const [assetData, setAssetData] = useState(null);
  const [assetLoading, setAssetLoading] = useState(true);
  const [assetError, setAssetError] = useState(null);

  // 관심주식 로딩 상태
  const [watchlistLoading, setWatchlistLoading] = useState(true);

  useEffect(() => {
    let refreshInterval;
    const load = async () => {
      // 한국투자 토큰 초기화 및 주기적 갱신
      await initializeHantuToken();
      refreshInterval = scheduleTokenRefresh();
      
      // 기존 데이터 로딩 로직
      await fetchUserInfo(navigation, setUserInfo);
      await fetchUserBalance(navigation, setBalance);
      await fetchAssetData();
      await loadWatchlistData(); // 관심주식 데이터 로딩 추가
    };
    load();
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      console.log("📥 MainScreen 다시 focus됨 → 데이터 재요청");
      fetchUserBalance(navigation, setBalance);
      fetchAssetData();
      loadWatchlistData(); // 관심주식 데이터도 새로고침
    });

    return unsubscribe;
  }, [navigation]);

  // 관심주식 데이터 로딩 함수
  const loadWatchlistData = async () => {
    try {
      setWatchlistLoading(true);
      console.log("⭐ 관심주식 데이터 로딩 시작");

      const result = await fetchWatchlist(navigation);
      
      if (result.success && result.watchlist) {
        // 관심주식 목록에 가격 정보 추가
        const enrichedWatchlist = await Promise.all(
          result.watchlist.map(async (stock, index) => {
            try {
              // API 호출 간격 (너무 많은 요청 방지)
              if (index > 0) {
                await new Promise(resolve => setTimeout(resolve, 300));
              }

              // 현재가 조회
              const priceResult = await fetchWithHantuToken(
                `${API_BASE_URL}trading/stock_price/?stock_code=${stock.symbol}`
              );

              let currentPrice = 0;
              if (priceResult.success && priceResult.data?.current_price) {
                currentPrice = priceResult.data.current_price;
              }

              // 가격 변동 정보 조회
              const changeResponse = await fetch(
                `${API_BASE_URL}stocks/price_change/?stock_code=${stock.symbol}`
              );

              let changeData = { price_change_percentage: 0, change_status: 'same' };
              if (changeResponse.ok) {
                const changeResult = await changeResponse.json();
                if (changeResult.status === 'success') {
                  changeData = changeResult;
                }
              }

              return {
                id: stock.id || `watchlist-${stock.symbol}`,
                name: stock.name,
                symbol: stock.symbol,
                price: currentPrice && !isNaN(currentPrice) ? currentPrice.toLocaleString() : "0",
                change: changeData.price_change_percentage >= 0 
                  ? `+${changeData.price_change_percentage.toFixed(2)}`
                  : `${changeData.price_change_percentage.toFixed(2)}`,
                changeStatus: changeData.change_status,
                isFavorite: true, // 관심주식이므로 항상 true
              };
            } catch (error) {
              console.error(`❌ ${stock.symbol} 가격 정보 조회 실패:`, error);
              return {
                id: stock.id || `watchlist-${stock.symbol}`,
                name: stock.name,
                symbol: stock.symbol,
                price: "0",
                change: "0.00",
                changeStatus: 'same',
                isFavorite: true,
              };
            }
          })
        );

        console.log("✅ 관심주식 데이터 로딩 완료:", enrichedWatchlist);
        setWatchlist(enrichedWatchlist);
      } else {
        console.log("📋 관심주식이 없음");
        setWatchlist([]);
      }
    } catch (error) {
      console.error("❌ 관심주식 데이터 로딩 실패:", error);
      setWatchlist([]);
    } finally {
      setWatchlistLoading(false);
    }
  };

  // 자산 데이터 가져오는 함수
  const fetchAssetData = async () => {
    try {
      setAssetLoading(true);

      const accessToken = await getNewAccessToken(navigation);

      if (!accessToken) {
        setAssetError("인증이 필요합니다");
        setAssetLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}api/asset/summary/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.status === "success") {
        const filteredData = {
          ...data,
          breakdown: data.breakdown
            ? data.breakdown.filter((item) => {
                if (item.label === "예수금") {
                  return true;
                }
                return item.value > 0;
              })
            : [],
        };

        console.log(
          "✅ MainScreen 필터링 전 breakdown:",
          data.breakdown?.length || 0,
          "개"
        );
        console.log(
          "✅ MainScreen 필터링 후 breakdown:",
          filteredData.breakdown?.length || 0,
          "개"
        );

        setAssetData(filteredData);
        setAssetError(null);
      } else {
        setAssetError("데이터를 불러오는 데 실패했습니다");
      }
    } catch (err) {
      console.error("자산 데이터 로딩 오류:", err);
      setAssetError("데이터를 불러오는 데 실패했습니다");
    } finally {
      setAssetLoading(false);
    }
  };

  // 새로고침
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchUserBalance(navigation, setBalance),
      fetchAssetData(),
      loadWatchlistData(),
    ]);
    setRefreshing(false);
  };

  // 관심주식 토글 함수
  const toggleFavorite = async (stockSymbol) => {
    try {
      console.log("⭐ 관심주식 토글:", stockSymbol);
      
      // 현재 상태 확인
      const currentStock = watchlist.find(stock => stock.symbol === stockSymbol);
      
      if (currentStock?.isFavorite) {
        // 1. 먼저 UI에서 별을 빈 별로 변경 (즉시 반영)
        setWatchlist(prev => 
          prev.map(stock => 
            stock.symbol === stockSymbol 
              ? { ...stock, isFavorite: false } // 빈 별로 변경
              : stock
          )
        );
        
        // 2. 백그라운드에서 서버에 제거 요청 (UI에서는 제거하지 않음)
        console.log("🗑️ 관심주식 해제 요청:", stockSymbol);
        const result = await removeFromWatchlist(navigation, stockSymbol);
        
        if (result.success) {
          console.log("✅ 관심주식 해제 완료 (새로고침 시 사라짐)");
        } else {
          // 서버 요청 실패 시 다시 채운 별로 되돌리기
          console.error("❌ 관심주식 해제 실패:", result.message);
          setWatchlist(prev => 
            prev.map(stock => 
              stock.symbol === stockSymbol 
                ? { ...stock, isFavorite: true } // 다시 채운 별로 복구
                : stock
            )
          );
        }
      } else {
        // 빈 별을 채운 별로 변경하고 관심주식에 추가
        setWatchlist(prev => 
          prev.map(stock => 
            stock.symbol === stockSymbol 
              ? { ...stock, isFavorite: true }
              : stock
          )
        );
        
        console.log("⭐ 관심주식 추가 요청:", stockSymbol);
        const result = await addToWatchlist(navigation, stockSymbol);
        
        if (!result.success) {
          // 서버 요청 실패 시 다시 빈 별로 되돌리기
          console.error("❌ 관심주식 추가 실패:", result.message);
          setWatchlist(prev => 
            prev.map(stock => 
              stock.symbol === stockSymbol 
                ? { ...stock, isFavorite: false }
                : stock
            )
          );
        }
      }
    } catch (error) {
      console.error("❌ 관심주식 토글 오류:", error);
    }
  };

  // 검색창 클릭 시 SearchScreen으로 이동
  const handleSearchPress = () => {
    navigation.navigate("SearchScreen");
  };

  // 상세 자산 페이지로 이동
  const navigateToAssetDetail = () => {
    navigation.navigate("AssetDetail");
  };

  // 주식 상세 페이지로 이동
  const handleStockPress = (stock) => {
    navigation.navigate("StockDetail", {
      symbol: stock.symbol,
      name: stock.name,
    });
  };

  // 금액 포맷팅
  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return "0";
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // 차트 데이터 준비
  const prepareChartData = () => {
    if (
      !assetData ||
      !assetData.breakdown ||
      assetData.breakdown.length === 0
    ) {
      console.log("⚠️ MainScreen: 차트 데이터가 없음");
      return [];
    }

    const chartColors = [
      "#F074BA", // 예수금 : 두둑 핑크
      "#3B82F6", // 파랑
      "#34D399", // 에메랄드
      "#10B981", // 녹색
      "#F59E0B", // 황색
      "#EF4444", // 빨강
      "#6366F1", // 보라
      "#8B5CF6", // 연보라
      "#EC4899", // 핑크
      "#F87171", // 연빨강
      "#FBBF24", // 주황
      "#4ADE80", // 연녹색
      "#22D3EE", // 하늘색
      "#60A5FA", // 연파랑
      "#A78BFA", // 라벤더
      "#F472B6", // 코랄 핑크
    ];

    const chartData = assetData.breakdown.map((item, index) => ({
      name: item.label,
      value: item.value,
      color: chartColors[index % chartColors.length],
      legendFontColor: "#EFF1F5",
      legendFontSize: 10,
    }));

    console.log("📊 MainScreen 차트 데이터 생성:", chartData.length, "개 항목");
    return chartData;
  };

  const renderChart = () => {
    const chartData = prepareChartData();

    if (chartData.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyChartText}>보유 자산이 없습니다</Text>
          <Text style={styles.emptyChartSubText}>
            주식 거래를 시작해보세요!
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.chartWrapper}>
        <PieChart
          data={chartData}
          width={screenWidth}
          height={screenWidth - 60}
          chartConfig={{
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          }}
          accessor="value"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute={false}
          hasLegend={false}
          center={[screenWidth * 0.13, 0]}
          avoidFalseZero
          style={styles.chart}
          innerRadius="70%"
        />

        <TouchableOpacity
          style={styles.detailButton}
          onPress={navigateToAssetDetail}
        >
          <Text style={styles.detailButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // 변동률 색상 반환
  const getChangeColor = (changeStatus) => {
    switch (changeStatus) {
      case 'up':
        return "#F074BA";
      case 'down':
        return "#00BFFF";
      default:
        return "#AAAAAA";
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.searchContainer}>
        <TouchableOpacity
          style={styles.searchInputContainer}
          onPress={handleSearchPress}
          activeOpacity={0.7}
        >
          <SearchIcon style={styles.searchIconInInput} width={18} height={18} />
          <Text style={styles.searchPlaceholder}>주식명 검색</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <BellIcon style={styles.BellIcon} width={24} height={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.assetContainer}>
        <Text style={styles.assetLabel}>예수금</Text>
        <Text style={styles.assetValue}>{balance}</Text>

        <View style={styles.graphContainer}>
          {assetLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#F074BA" />
              <Text style={styles.loadingText}>자산 정보 로딩 중...</Text>
            </View>
          ) : assetError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{assetError}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={fetchAssetData}
              >
                <Text style={styles.retryButtonText}>다시 시도</Text>
              </TouchableOpacity>
            </View>
          ) : (
            renderChart()
          )}
        </View>
      </View>

      {/* 총 자산 정보를 그래프 아래로 이동 */}
      <View style={styles.totalAssetInfoContainer}>
        <View style={styles.totalAssetInfo}>
          <Text style={styles.totalAssetLabel}>총 자산</Text>
          {assetData && assetData.total_asset ? (
            <Text style={styles.totalAssetAmount}>
              {formatCurrency(assetData.total_asset)}원
            </Text>
          ) : (
            <Text style={styles.totalAssetAmount}>0원</Text>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={styles.tradeButton}
        onPress={() => navigation.navigate("StockTrade")}
      >
        <Text style={styles.tradeButtonText}>주식 거래하기 📈</Text>
      </TouchableOpacity>

      <View style={styles.watchlistContainer}>
        <Text style={styles.watchlistTitle}>나의 관심 주식</Text>
        
        {watchlistLoading ? (
          <View style={styles.watchlistLoadingContainer}>
            <ActivityIndicator size="large" color="#F074BA" />
            <Text style={styles.watchlistLoadingText}>관심주식 로딩 중...</Text>
          </View>
        ) : watchlist.length > 0 ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            {watchlist.map((stock) => (
              <TouchableOpacity
                key={stock.id}
                style={styles.stockItem}
                onPress={() => handleStockPress(stock)}
                activeOpacity={0.7}
              >
                <TouchableOpacity 
                  onPress={(e) => {
                    e.stopPropagation(); // 부모 터치 이벤트 방지
                    toggleFavorite(stock.symbol);
                  }}
                  style={styles.starTouchArea}
                >
                  <Image
                    source={
                      stock.isFavorite
                        ? require("../../assets/icons/star-filled.png")
                        : require("../../assets/icons/star-empty.png")
                    }
                    style={styles.starIcon}
                  />
                </TouchableOpacity>
                <Text style={styles.stockName}>{stock.name}</Text>
                <View style={styles.stockPriceContainer}>
                  <Text style={styles.stockPrice}>{stock.price}원</Text>
                  <Text 
                    style={[
                      styles.stockChange,
                      { color: getChangeColor(stock.changeStatus) }
                    ]}
                  >
                    {stock.change}%
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyWatchlist}>
            <Text style={styles.emptyWatchlistText}>관심주식이 없습니다</Text>
            <Text style={styles.emptyWatchlistSubText}>
              검색창에서 주식을 찾아 관심주식으로 등록해보세요!
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#003340",
  },
  scrollContent: {
    paddingHorizontal: 30,
    paddingTop: 10,
    paddingBottom: 120, // 탭 바 공간 확보
  },
  searchContainer: {
    marginTop: 60,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    justifyContent: "space-between",
  },
  searchInputContainer: {
    flex: 1,
    backgroundColor: "#EFF1F5",
    borderRadius: 13,
    padding: 10,
    marginRight: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  searchIconInInput: {
    width: 18,
    height: 18,
    fill: "#6B7280",
    marginRight: 8,
  },
  searchPlaceholder: {
    color: "#6B7280",
    fontSize: 14,
  },
  BellIcon: {
    width: 24,
    height: 24,
    fill: "#EFF1F5",
  },
  assetContainer: {
    marginBottom: 20,
  },
  assetLabel: {
    color: "#F074BA",
    fontSize: 18,
  },
  assetValue: {
    color: "#F074BA",
    fontSize: 40,
    fontWeight: "bold",
  },
  graphContainer: {
    height: screenWidth - 180,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  chartWrapper: {
    position: "relative",
    width: screenWidth - 120,
    height: screenWidth - 120,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8.65,
    elevation: 8,
  },
  chart: {
    position: "absolute",
    top: 0,
    left: 20,
  },
  detailButton: {
    position: "absolute",
    bottom: 50,
    right: 0,
    backgroundColor: "#6366F1",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 20,
  },
  detailButtonText: {
    color: "#EFF1F5",
    fontSize: 24,
    fontWeight: "bold",
  },
  // 총 자산 정보 컨테이너 (그래프 밖으로 이동)
  totalAssetInfoContainer: {
    alignItems: "flex-end",
    marginBottom: 15,
    marginTop: -10,
  },
  totalAssetInfo: {
    //backgroundColor: "rgba(239, 241, 245, 0.1)", // UI 개선 제안: 배경색 추가로 가독성 향상
    paddingHorizontal: 36,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "flex-end",
  },
  totalAssetLabel: {
    color: "#EFF1F5",
    fontSize: 14,
    fontWeight: "600",
    opacity: 0.8,
  },
  totalAssetAmount: {
    color: "#F074BA",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 8,
    color: "#EFF1F5",
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  errorText: {
    color: "#FF6B6B",
    marginBottom: 12,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#F074BA",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#EFF1F5",
    fontWeight: "bold",
  },
  tradeButton: {
    backgroundColor: "#EFF1F5",
    padding: 13,
    borderRadius: 13,
    alignItems: "center",
    marginBottom: 20,
  },
  tradeButtonText: {
    color: "#003340",
    fontSize: 18,
    fontWeight: "900",
  },
  watchlistContainer: {
    flex: 1,
    minHeight: 200, // 최소 높이 설정
  },
  watchlistTitle: {
    color: "#F074BA",
    fontSize: 18,
    marginBottom: 10,
    marginLeft: 5,
    marginTop: 5,
    fontWeight: "600",
  },
  watchlistLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  watchlistLoadingText: {
    color: "#EFF1F5",
    fontSize: 16,
    marginTop: 10,
    textAlign: "center",
  },
  starTouchArea: {
    padding: 8, // 터치 영역 확장
    marginRight: 2,
  },
  starIcon: {
    width: 20,
    height: 20,
  },
  stockItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#004455",
    // UI 개선 제안: 각 아이템에 paddingVertical을 좀 더 추가해서 터치 영역 확보 (예: paddingVertical: 12)
  },
  stockName: {
    flex: 1,
    color: "#EFF1F5",
    marginLeft: 10,
    // UI 개선 제안: fontSize 명시적으로 추가 (예: fontSize: 15)
  },
  stockPriceContainer: {
    alignItems: "flex-end",
  },
  stockPrice: {
    color: "#EFF1F5",
    // UI 개선 제안: fontSize와 fontWeight 명시적으로 추가 (예: fontSize: 15, fontWeight: "500")
  },
  stockChange: {
    fontWeight: "bold",
    // UI 개선 제안: fontSize 명시적으로 추가 (예: fontSize: 13)
  },
  emptyChart: {
    height: screenWidth - 60,
    width: screenWidth - 60,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#004455",
    borderRadius: 16,
  },
  emptyChartText: {
    color: "#EFF1F5",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  emptyChartSubText: {
    color: "rgba(239, 241, 245, 0.7)",
    fontSize: 14,
  },
  emptyWatchlist: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyWatchlistText: {
    color: "#EFF1F5",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyWatchlistSubText: {
    color: "rgba(239, 241, 245, 0.7)",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default MainScreen;