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

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const { login } = useAuth();
  const { alertProps, showAlert } = useAlert();
  const insets = useSafeAreaInsets();

  const handleLogin = async () => {
    if (!email || !password) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert({ type: 'error', title: 'Missing Fields', message: 'Please fill in all fields to continue.' });
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      await login(email, password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert({ type: 'error', title: 'Login Failed', message: error.response?.data?.message || 'Incorrect credentials. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.gradientStart} translucent />
      <CustomAlert {...alertProps} />

      {/* Gradient hero top */}
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        style={[styles.hero, { paddingTop: insets.top + 32 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <AnimatedView entering={FadeInDown.duration(500).delay(100)} style={styles.heroContent}>
          <View style={styles.logoCircle}>
            <Ionicons name="wallet" size={40} color="#FFF" />
          </View>
          <Text style={styles.appName}>Expensu</Text>
          <Text style={styles.tagline}>Split expenses, not friendships</Text>
        </AnimatedView>
      </LinearGradient>

      {/* Card form */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <AnimatedView entering={FadeInUp.duration(500).delay(200)} style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back 👋</Text>
          <Text style={styles.cardSubtitle}>Sign in to your account</Text>

          {/* Email or Username */}
          <View style={[styles.inputWrap, focusedField === 'email' && styles.inputWrapFocused]}>
            <Ionicons
              name="person-outline" size={20}
              color={focusedField === 'email' ? COLORS.primary : COLORS.gray}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Email or Username"
              placeholderTextColor={COLORS.gray}
              value={email}
              onChangeText={setEmail}
              keyboardType="default"
              autoCapitalize="none"
              editable={!loading}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          {/* Password */}
          <View style={[styles.inputWrap, focusedField === 'password' && styles.inputWrapFocused]}>
            <Ionicons
              name="lock-closed-outline" size={20}
              color={focusedField === 'password' ? COLORS.primary : COLORS.gray}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={COLORS.gray}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.gray} />
            </TouchableOpacity>
          </View>

          {/* Sign In button */}
          <TouchableOpacity
            style={[styles.btnWrapper, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
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
                : <Text style={styles.btnText}>Sign In</Text>
              }
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerPrompt}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')} disabled={loading}>
              <Text style={styles.footerLink}>Register</Text>
            </TouchableOpacity>
          </View>
        </AnimatedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F5FA' },
  hero: {
    paddingHorizontal: 28,
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroContent: { alignItems: 'center' },
  logoCircle: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)',
  },
  appName: { fontSize: 32, fontWeight: '800', color: '#FFF', letterSpacing: -0.5, marginBottom: 6 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },

  scrollContent: { padding: 20, paddingTop: 24 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 20,
    elevation: 5,
  },
  cardTitle: { fontSize: 22, fontWeight: '800', color: COLORS.dark, marginBottom: 4 },
  cardSubtitle: { fontSize: 14, color: COLORS.gray, marginBottom: 24 },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#EBEBF0',
    borderRadius: 14, backgroundColor: '#FAFAFE',
    marginBottom: 14, overflow: 'hidden',
  },
  inputWrapFocused: { borderColor: COLORS.primary, backgroundColor: '#FFF' },
  inputIcon: { paddingHorizontal: 14 },
  input: { flex: 1, fontSize: 15, color: COLORS.dark, paddingVertical: 16, paddingRight: 12 },
  eyeIcon: { paddingHorizontal: 14 },

  btnWrapper: { borderRadius: 14, overflow: 'hidden', marginTop: 8, marginBottom: 24 },
  btn: { paddingVertical: 17, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },

  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerPrompt: { fontSize: 14, color: COLORS.gray },
  footerLink: { fontSize: 14, color: COLORS.primary, fontWeight: '700' },
});