import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';

const SplashScreen = ({navigation}) => {
  const [fadeAnim1] = useState(new Animated.Value(1));
  const [fadeAnim2] = useState(new Animated.Value(0));
  const [isFirstLogo, setIsFirstLogo] = useState(true);

  useEffect(() => {
    const crossFade = () => {
      Animated.parallel([
        // 현재 보이는 로고는 페이드 아웃
        Animated.timing(isFirstLogo ? fadeAnim1 : fadeAnim2, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
        // 다음 로고는 페이드 인
        Animated.timing(isFirstLogo ? fadeAnim2 : fadeAnim1, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsFirstLogo(!isFirstLogo);
        // 약간의 딜레이 후 다음 애니메이션 시작
        setTimeout(crossFade, 1000);
      });
    };

    crossFade();

    return () => {
      fadeAnim1.stopAnimation();
      fadeAnim2.stopAnimation();
    };
  }, [fadeAnim1, fadeAnim2, isFirstLogo]); // 의존성 배열에 사용되는 변수들 추가

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Animated.View style={[styles.logoWrapper, {opacity: fadeAnim1}]}>
          <Image
            source={require('../../assets/logo-ko.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
        <Animated.View style={[styles.logoWrapper, {opacity: fadeAnim2}]}>
          <Image
            source={require('../../assets/logo-en.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => navigation.navigate('MainTab')}>
          <Text style={styles.startButtonText}>시작하기</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signupButton}
          onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.signupButtonText}>
            두둑이 처음이라면?{' '}
            <Text style={[styles.signupButtonText, styles.underline]}>
              회원가입
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#003340',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 250,
    height: 250,
  },
  slogan: {
    color: '#F074BA',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 40,
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
});

export default SplashScreen;
