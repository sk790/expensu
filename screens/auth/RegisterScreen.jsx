import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../utils/constants';
import { FadeInDown, FadeInUp } from 'react-native-reanimated';
import AnimatedView from "../../components/AnimatedView";
import * as Haptics from 'expo-haptics';
import CustomAlert from '../../components/CustomAlert';
import { useAlert } from '../../hooks/useAlert';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const { register } = useAuth();
  const { alertProps, showAlert } = useAlert();
  const insets = useSafeAreaInsets();

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert({ type: 'error', title: 'Missing Fields', message: 'Please fill in all fields to continue.' });
      return;
    }
    if (password !== confirmPassword) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert({ type: 'error', title: 'Password Mismatch', message: 'Passwords do not match. Please try again.' });
      return;
    }
    if (password.length < 4) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert({ type: 'warning', title: 'Weak Password', message: 'Password must be at least 4 characters long.' });
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      await register(name, email, password, referralCode);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert({ type: 'error', title: 'Registration Failed', message: error.response?.data?.message || 'Could not create account. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: 'name', label: 'Full Name', icon: 'person-outline', value: name, setter: setName, type: 'default', secure: false },
    { key: 'email', label: 'Email address', icon: 'mail-outline', value: email, setter: setEmail, type: 'email-address', secure: false },
    { key: 'password', label: 'Password', icon: 'lock-closed-outline', value: password, setter: setPassword, type: 'default', secure: !showPassword, toggleShow: () => setShowPassword(!showPassword), showState: showPassword },
    { key: 'confirmPassword', label: 'Confirm Password', icon: 'shield-checkmark-outline', value: confirmPassword, setter: setConfirmPassword, type: 'default', secure: !showConfirmPassword, toggleShow: () => setShowConfirmPassword(!showConfirmPassword), showState: showConfirmPassword },
    { key: 'referralCode', label: 'Referral Code (Optional)', icon: 'gift-outline', value: referralCode, setter: setReferralCode, type: 'default', secure: false },
  ];

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.gradientStart} translucent />
      <CustomAlert {...alertProps} />

      {/* Gradient hero */}
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        style={[styles.hero, { paddingTop: insets.top + 28 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <AnimatedView entering={FadeInDown.duration(500).delay(100)} style={styles.heroContent}>
          <View style={styles.logoCircle}>
            <Ionicons name="person-add" size={36} color="#FFF" />
          </View>
          <Text style={styles.appName}>Create Account</Text>
          <Text style={styles.tagline}>Join SplitMate and split smartly</Text>
        </AnimatedView>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <AnimatedView entering={FadeInUp.duration(500).delay(200)} style={styles.card}>
          {fields.map((field, index) => (
            <AnimatedView key={field.key} entering={FadeInDown.duration(300).delay(100 + index * 55)}>
              <View style={[styles.inputWrap, focusedField === field.key && styles.inputWrapFocused]}>
                <Ionicons
                  name={field.icon} size={20}
                  color={focusedField === field.key ? COLORS.primary : COLORS.gray}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder={field.label}
                  placeholderTextColor={COLORS.gray}
                  value={field.value}
                  onChangeText={field.setter}
                  keyboardType={field.type}
                  autoCapitalize={field.key === 'name' ? 'words' : 'none'}
                  secureTextEntry={field.secure}
                  editable={!loading}
                  onFocus={() => setFocusedField(field.key)}
                  onBlur={() => setFocusedField(null)}
                />
                {field.toggleShow && (
                  <TouchableOpacity onPress={field.toggleShow} style={styles.eyeIcon}>
                    <Ionicons name={field.showState ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.gray} />
                  </TouchableOpacity>
                )}
              </View>
            </AnimatedView>
          ))}

          <TouchableOpacity
            style={[styles.btnWrapper, loading && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[COLORS.gradientStart, COLORS.gradientEnd]}
              style={styles.btn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading
                ? <ActivityIndicator color="#FFF" />
                : <Text style={styles.btnText}>Create Account</Text>
              }
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerPrompt}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={loading}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </AnimatedView>
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F5FA' },
  hero: {
    paddingHorizontal: 28,
    paddingBottom: 36,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroContent: { alignItems: 'center' },
  logoCircle: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)',
  },
  appName: { fontSize: 26, fontWeight: '800', color: '#FFF', letterSpacing: -0.3, marginBottom: 4 },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },

  scrollContent: { padding: 20, paddingTop: 24 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 20,
    elevation: 5,
  },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#EBEBF0',
    borderRadius: 14, backgroundColor: '#FAFAFE',
    marginBottom: 12, overflow: 'hidden',
  },
  inputWrapFocused: { borderColor: COLORS.primary, backgroundColor: '#FFF' },
  inputIcon: { paddingHorizontal: 14 },
  input: { flex: 1, fontSize: 15, color: COLORS.dark, paddingVertical: 15, paddingRight: 12 },
  eyeIcon: { paddingHorizontal: 14 },

  btnWrapper: { borderRadius: 14, overflow: 'hidden', marginTop: 10, marginBottom: 24 },
  btn: { paddingVertical: 17, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },

  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerPrompt: { fontSize: 14, color: COLORS.gray },
  footerLink: { fontSize: 14, color: COLORS.primary, fontWeight: '700' },
});