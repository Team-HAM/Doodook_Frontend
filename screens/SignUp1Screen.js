import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import CheckBoxChecked from '../components/CheckBoxChecked';
import CheckBoxUnchecked from '../components/CheckBoxUnchecked';

const SignUp1Screen = ({ navigation }) => {
  const [agreements, setAgreements] = useState({
    all: false,
    required1: false,
    required2: false,
    required3: false,
    required4: false,
    required5: false,
    required6: false,
    optional1: false,
    optional2: false,
  });

  const toggleAll = () => {
    const newState = !agreements.all;
    setAgreements({
      all: newState,
      required1: newState,
      required2: newState,
      required3: newState,
      required4: newState,
      required5: newState,
      required6: newState,
      optional1: newState,
      optional2: newState,
    });
  };

  const toggleItem = (key) => {
    setAgreements((prevAgreements) => {
      const newAgreements = { ...prevAgreements, [key]: !prevAgreements[key] };
      newAgreements.all =
        newAgreements.required1 &&
        newAgreements.required2 &&
        newAgreements.required3 &&
        newAgreements.required4 &&
        newAgreements.required5 &&
        newAgreements.required6 &&
        newAgreements.optional1 &&
        newAgreements.optional2;
      return newAgreements;
    });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backText}>{'<'}</Text>
      </TouchableOpacity>
      <Text style={styles.title}>이용 약관에{"\n"}동의해 주세요</Text>
      <TouchableOpacity onPress={toggleAll} style={styles.allAgree}>
        {agreements.all ? <CheckBoxChecked /> : <CheckBoxUnchecked />}
        <Text style={styles.allAgreeText}>전체 동의</Text>
      </TouchableOpacity>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {[
          { key: 'required1', label: '[필수] 두독 이용 약관' },
          { key: 'required2', label: '[필수] 개인정보 수집·이용 동의' },
          { key: 'required3', label: '[필수] 민감정보 수집·이용 동의' },
          { key: 'required4', label: '[필수] 개인정보 제3자 제공 동의' },
          { key: 'required5', label: '[필수] 개인정보 국외 이전 동의' },
          { key: 'required6', label: '[필수] 만 14세 이상입니다.' },
          { key: 'optional1', label: '[선택] 마케팅 활용 동의' },
          { key: 'optional2', label: '[선택] 광고성 정보 수신 동의' },
        ].map((item) => (
          <TouchableOpacity key={item.key} onPress={() => toggleItem(item.key)} style={styles.agreeItem}>
            {agreements[item.key] ? <CheckBoxChecked /> : <CheckBoxUnchecked />}
            <Text style={styles.agreeText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity
        style={[
          styles.button,
          !(agreements.required1 && agreements.required2 && agreements.required3 &&
            agreements.required4 && agreements.required5 && agreements.required6)
            ? styles.buttonDisabled
            : null,
        ]}
        disabled={!(agreements.required1 && agreements.required2 && agreements.required3 &&
          agreements.required4 && agreements.required5 && agreements.required6)}
        onPress={() => navigation.navigate('SignUp2')}
      >
        <Text style={styles.buttonText}>동의하기</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#003340',
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
    color: '#F074BA',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F074BA',
    position: 'absolute',
    top: 150,
    left: 30,
  },
  allAgree: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#F074BA',
    top: 150,
    marginTop: 20,
    marginBottom: 10,
  },
  allAgreeText: {
    fontSize: 16,
    color: '#F074BA',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  scrollView: {
    flex: 1,
    marginTop: 150,
    marginBottom: 20,
    maxHeight: 400,
  },
  agreeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 10,
    justifyContent: 'flex-start',
  },
  agreeText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
    marginLeft: 10,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#F074BA',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#F8C7CC',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SignUp1Screen;
