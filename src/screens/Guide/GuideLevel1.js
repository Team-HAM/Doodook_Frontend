import React from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';

// SVG 아이콘 import
import CheckIcon from '../../assets/icons/studycheck.svg';
import LockIcon from '../../assets/icons/studylock.svg';
import StudyingIcon from '../../assets/icons/studying.svg';

const levels = [
  { id: 1, type: 'start', screen: 'Step1' },
  { id: 2, type: 'done', screen: 'Step2' },
  { id: 3, type: 'done', screen: 'Step3' },
  { id: 4, type: 'chest', screen: 'Step4' },
  { id: 5, type: 'locked', screen: 'Step5' },
  { id: 6, type: 'locked', screen: 'Step6' },
];

const GuideLevel1 = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backText}>{'<'}</Text>
      </TouchableOpacity>
      <Text style={styles.title}>1단계</Text>

      <ScrollView contentContainerStyle={styles.scrollView} showsVerticalScrollIndicator={false}>
        {levels.map((item, index) => {
          const isLeft = index % 2 === 0;

          const renderIcon = () => {
            switch (item.type) {
              case 'start':
                return null; // 나중에 start 아이콘 추가할 예정
              case 'done':
                return <CheckIcon width={96} height={96} />;
              case 'chest':
                return <StudyingIcon width={128} height={128} />;
              case 'locked':
                return <LockIcon width={96} height={96} />;
              default:
                return null;
            }
          };

          const isClickable = item.type !== 'locked';

          const content =
            item.type === 'start' ? (
              <Text style={styles.startText}>START</Text>
            ) : (
              renderIcon()
            );

          return (
            <View
              key={index}
              style={[styles.stepContainer, isLeft ? styles.left : styles.right]}
            >
              {isClickable ? (
                <TouchableOpacity onPress={() => navigation.navigate(item.screen)}>
                  {content}
                </TouchableOpacity>
              ) : (
                content
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#B7E2ED',
//     paddingHorizontal: 30,
//     paddingTop: 60,
//   },
container: {
    flex: 1,
    backgroundColor: '#6DC0D4',
    paddingHorizontal: 30,
    paddingTop: 60,
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
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 12,
    width: '100%',
  },
  left: {
    justifyContent: 'flex-start',
    paddingLeft: '15%',
  },
  right: {
    justifyContent: 'flex-end',
    paddingRight: '15%',
  },
  startText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginVertical: 10,
  },
});

export default GuideLevel1;
