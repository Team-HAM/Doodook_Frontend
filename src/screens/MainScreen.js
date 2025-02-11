// src/screens/MainScreen.js
import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Image,
} from 'react-native';

const mockStocks = [
  {
    id: 1,
    name: '뱅가드 토탈 미국 주식 ETF',
    price: '429,710',
    change: '+0.03',
    isFavorite: true,
  },
  {
    id: 2,
    name: '스포티파이 테크놀로지',
    price: '692,438',
    change: '+0.75',
    isFavorite: true,
  },
  // 더 많은 mock 데이터 추가 가능
];

const MainScreen = ({navigation}) => {
  const [searchText, setSearchText] = useState('');
  const [watchlist, setWatchlist] = useState(mockStocks);

  const toggleFavorite = id => {
    setWatchlist(
      watchlist.map(stock =>
        stock.id === id ? {...stock, isFavorite: !stock.isFavorite} : stock,
      ),
    );
  };

  return (
    <View style={styles.container}>
      {/* 검색바 */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="주식명 검색"
          value={searchText}
          onChangeText={setSearchText}
        />
        <TouchableOpacity>
          <Image source={require('../../assets/icons/bell.svg')} />
        </TouchableOpacity>
      </View>

      {/* 자산 정보 */}
      <View style={styles.assetContainer}>
        <Text style={styles.assetLabel}>자산</Text>
        <Text style={styles.assetValue}>9,897,654원</Text>

        {/* Mock 그래프 영역 */}
        <View style={styles.graphContainer}>
          <View style={styles.mockGraph} />
        </View>
      </View>

      {/* 주식 거래하기 버튼 */}
      <TouchableOpacity
        style={styles.tradeButton}
        onPress={() => navigation.navigate('StockTrade')}>
        <Text style={styles.tradeButtonText}>주식 거래하기 📈</Text>
      </TouchableOpacity>

      {/* 관심 주식 리스트 */}
      <View style={styles.watchlistContainer}>
        <Text style={styles.watchlistTitle}>나의 관심 주식</Text>
        <ScrollView>
          {watchlist.map(stock => (
            <View key={stock.id} style={styles.stockItem}>
              <TouchableOpacity onPress={() => toggleFavorite(stock.id)}>
                <Image
                  source={
                    stock.isFavorite
                      ? require('../../assets/icons/star-filled.png')
                      : require('../../assets/icons/star-empty.png')
                  }
                  style={styles.starIcon}
                />
              </TouchableOpacity>
              <Text style={styles.stockName}>{stock.name}</Text>
              <View style={styles.stockPriceContainer}>
                <Text style={styles.stockPrice}>{stock.price}원</Text>
                <Text style={styles.stockChange}>{stock.change}%</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#003340',
    padding: 30,
  },
  searchContainer: {
    marginTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#EFF1F5',
    borderRadius: 13,
    padding: 10,
    marginRight: 10,
  },
  assetContainer: {
    marginBottom: 20,
  },
  assetLabel: {
    color: '#F074BA',
    fontSize: 18,
  },
  assetValue: {
    color: '#F074BA',
    fontSize: 40,
    fontWeight: 'bold',
    //marginTop: 5,
  },
  graphContainer: {
    height: 200,
    backgroundColor: '#004455',
    borderRadius: 8,
    marginTop: 10,
  },
  percentageContainer: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
  tradeButton: {
    backgroundColor: '#EFF1F5',
    padding: 13,
    borderRadius: 13,
    alignItems: 'center',
    marginBottom: 20,
  },
  tradeButtonText: {
    color: '#003340',
    fontSize: 18,
    fontWeight: '900',
  },
  watchlistContainer: {
    flex: 1,
  },
  watchlistTitle: {
    color: '#F074BA',
    fontSize: 18,
    marginBottom: 10,
  },
  stockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#004455',
  },
  stockName: {
    flex: 1,
    color: '#EFF1F5',
    marginLeft: 10,
  },
  stockPriceContainer: {
    alignItems: 'flex-end',
  },
  stockPrice: {
    color: '#EFF1F5',
  },
  stockChange: {
    color: '#F074BA',
  },
  starIcon: {
    width: 24,
    height: 24,
  },
  percentageText: {
    color: '#EFF1F5',
  },
  percentageBar: {
    marginBottom: 5,
  },
});

export default MainScreen;
