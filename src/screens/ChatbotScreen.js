import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

const ChatbotScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>챗봇 화면</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#003340',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#EFF1F5',
    fontSize: 18,
  },
});

export default ChatbotScreen;
