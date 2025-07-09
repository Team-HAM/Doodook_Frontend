import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const SplashScreen = ({navigation}) => {
  return (
    <View style={styles.container}>
      {/* 배경 GIF - 화면 전체를 덮도록 절대 위치 설정 */}
      <Image
        source={require('../../assets/images/splashlogo.gif')}
        style={styles.backgroundGif}
        resizeMode="cover" // 화면을 꽉 채우되 비율 유지
      />
      
      {/* 오버레이 - 필요시 배경 위에 약간의 어두운 필터 */}
      <View style={styles.overlay} />

      {/* 메인 컨텐츠 */}
      <View style={styles.contentContainer}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/splashlogoonly7.png')}
            style={styles.centerLogo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => navigation.navigate('Login')}>
            <Text style={styles.startButtonText}>시작하기</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signupButton}
            onPress={() => navigation.navigate('SignUp1')}>
            <Text style={styles.signupButtonText}>
              두둑이 처음이라면?{' '}
              <Text style={[styles.signupButtonText, styles.underline]}>
                회원가입
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#003340', // 폴백 배경색
  },
  
  backgroundGif: {
    position: 'absolute',
    top: 0, 
    left: 0,
    width: screenWidth,
    height: screenHeight + 100, // 위아래로 이동한 만큼 높이 증가
    zIndex: -1,
  },
  
  // overlay: {
  //   position: 'absolute',
  //   top: 0,
  //   left: 0,
  //   width: screenWidth,
  //   height: screenHeight,
  //   backgroundColor: 'rgba(0, 51, 64, 0.3)', // 원래 배경색을 30% 투명도로
  //   zIndex: 0,
  // },
  // 메인 컨텐츠 컨테이너
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1, // 배경 위에 표시
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  startButton: {
    backgroundColor: '#EFF1F5',
    paddingVertical: 15,
    borderRadius: 13,
    width: '100%',
    marginBottom: 5,
  },
  startButtonText: {
    color: '#003340',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
  },
  underline: {
    textDecorationLine: 'underline',
  },
  signupButton: {
    paddingVertical: 10,
  },
  signupButtonText: {
    color: '#FFD1EB',
    textAlign: 'center',
    fontSize: 14,
  },
  centerLogo: {
    marginTop: 280,
    width: 170, 
    height: 200,
    maxWidth: '100%', 
    maxHeight: '40%',

    // iOS 그림자 스타일
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.20,
    shadowRadius: 12,
    // Android 그림자 스타일
    elevation: 15,
  },
});


export default SplashScreen;

