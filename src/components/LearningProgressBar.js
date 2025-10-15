// components/LearningProgressBar.js

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

const LearningProgressBar = ({ current = 12, total = 20 }) => {
  const progress = Math.min(current / total, 1);

  return (
    <View style={styles.wrapper}>
      {/* <Icon name="trophy" size={16} color="#fff" style={styles.icon} /> */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressFill, { flex: progress }]} />
        <View style={{ flex: 1 - progress }} />
      </View>
      <Text style={styles.progressText}>
        {current} / {total}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    //backgroundColor: '#5DB99610', // 전체 배경색
    padding: 8,
    borderRadius: 15,
    marginHorizontal: 5,
  },
//   icon: {
//     marginRight: 8,
//   },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#5DB99630', // 남은 부분 색
    borderRadius: 15,
    overflow: 'hidden',
    height: 20,
    marginRight: 8,
  },
  progressFill: {
    backgroundColor: '#5DB996E0', // 진행된 부분 색
  },
  progressText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    minWidth: 50,
    textAlign: 'right',
  },
});

export default LearningProgressBar;
