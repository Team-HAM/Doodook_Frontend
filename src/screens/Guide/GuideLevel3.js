// GuideLevel3.js
import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

// SVG 아이콘 import
import CheckIcon from '../../assets/icons/studycheck.svg';
import LockIcon from '../../assets/icons/studylock.svg';
import StudyingIcon from '../../assets/icons/studying.svg';

import { API_BASE_URL } from '../../utils/apiConfig';
import { getNewAccessToken } from '../../utils/token';

const GuideLevel3 = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [contentProgress, setContentProgress] = useState({});

  useEffect(() => {
    const fetchProgress = async () => {
      setLoading(true);
      const accessToken = await getNewAccessToken(navigation);
      if (!accessToken) {
        Alert.alert('인증 오류', '토큰이 만료되었습니다. 다시 로그인해주세요.');
        navigation.navigate('Login');
        return;
      }

      try {
        const res = await fetch(
          `${API_BASE_URL}progress/level/3/content/`,
          {
            method: 'GET',
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        if (!res.ok) throw new Error(`Level 3 content fetch failed: ${res.status}`);
        const data = await res.json();
        setContentProgress(data.content_progress);
      } catch (err) {
        console.error(err);
        Alert.alert('데이터 오류', '진행도 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [navigation]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  // progress 객체를 [ { id, done }, ... ] 형태로 변환 & 정렬
  const entries = Object.entries(contentProgress)
    .map(([key, done]) => ({ id: Number(key), done }))
    .sort((a, b) => a.id - b.id);

  const firstIncomplete = entries.find(e => !e.done)?.id;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
        accessibilityLabel="뒤로가기"
      >
        <Text style={styles.backText}>{'<'}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>3단계</Text>

      <ScrollView
        contentContainerStyle={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {entries.map(({ id, done }, idx) => {
          const isChest = !done && id === firstIncomplete;
          let IconComp;
          if (done) {
            IconComp = <CheckIcon width={96} height={96} />;
          } else if (isChest) {
            IconComp = <StudyingIcon width={128} height={128} />;
          } else {
            IconComp = <LockIcon width={96} height={96} />;
          }

          const clickable = done || isChest;
          const handlePress = () => {
            navigation.navigate('StudyScreen', {
              level: 3,
              contentIndex: id,
            });
          };

          return (
            <View
              key={id}
              style={[
                styles.stepContainer,
                idx % 2 === 0 ? styles.left : styles.right,
              ]}
            >
              <View style={styles.stepBox}>
                {clickable ? (
                  <TouchableOpacity onPress={handlePress}>
                    {IconComp}
                  </TouchableOpacity>
                ) : (
                  IconComp
                )}
                <Text style={styles.chapterLabel}>{`챕터 3-${id}`}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#037F9F',
    paddingHorizontal: 30,
    paddingTop: 60,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  backText: {
    fontSize: 36,
    color: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    alignSelf: 'center',
    marginBottom: 20,
  },
  scrollView: {
    marginTop: 20,
    paddingBottom: 60,
  },
  stepContainer: {
    width: '100%',
    marginVertical: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  left: {
    justifyContent: 'flex-start',
    paddingLeft: '15%',
  },
  right: {
    justifyContent: 'flex-end',
    paddingRight: '15%',
  },
  stepBox: {
    alignItems: 'center',
  },
  chapterLabel: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF40',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#003340A0',
  },
});

export default GuideLevel3;
