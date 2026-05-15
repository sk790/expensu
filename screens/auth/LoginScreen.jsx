import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../utils/constants';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
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
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <CustomAlert {...alertProps} />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <AnimatedView entering={FadeInDown.duration(600).delay(100)} style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="wallet" size={48} color={COLORS.white} />
          </View>
          <Text style={styles.appName}>Expensu</Text>
          <Text style={styles.tagline}>Split expenses, not friendships</Text>
        </AnimatedView>

        <AnimatedView entering={FadeInUp.duration(600).delay(300)} style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardSubtitle}>Sign in to your account</Text>

          <View style={[styles.inputWrapper, focusedField === 'email' && styles.inputWrapperFocused]}>
            <Ionicons name="mail-outline" size={20} color={focusedField === 'email' ? COLORS.primary : COLORS.gray} style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Email address" placeholderTextColor={COLORS.gray} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" editable={!loading} onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)} />
          </View>

          <View style={[styles.inputWrapper, focusedField === 'password' && styles.inputWrapperFocused]}>
            <Ionicons name="lock-closed-outline" size={20} color={focusedField === 'password' ? COLORS.primary : COLORS.gray} style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Password" placeholderTextColor={COLORS.gray} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} editable={!loading} onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)} />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.gray} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.loginButton, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.loginButtonText}>Sign In</Text>}
          </TouchableOpacity>

          <View style={styles.registerRow}>
            <Text style={styles.registerPrompt}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')} disabled={loading}>
              <Text style={styles.registerLink}>Register</Text>
            </TouchableOpacity>
          </View>
        </AnimatedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  heroSection: { alignItems: 'center', marginBottom: 36 },
  logoContainer: { width: 88, height: 88, borderRadius: 28, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
  appName: { fontSize: 34, fontWeight: 'bold', color: COLORS.dark, letterSpacing: -0.5 },
  tagline: { fontSize: 15, color: COLORS.gray, marginTop: 6 },
  card: { backgroundColor: COLORS.white, borderRadius: 24, padding: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 4 },
  cardTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.dark, marginBottom: 4 },
  cardSubtitle: { fontSize: 14, color: COLORS.gray, marginBottom: 28 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#F0F0F0', borderRadius: 14, backgroundColor: '#FAFAFA', marginBottom: 16, overflow: 'hidden' },
  inputWrapperFocused: { borderColor: COLORS.primary, backgroundColor: COLORS.white },
  inputIcon: { paddingHorizontal: 16 },
  input: { flex: 1, fontSize: 16, color: COLORS.dark, paddingVertical: 16, paddingRight: 12 },
  eyeIcon: { paddingHorizontal: 16 },
  loginButton: { backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: 14, alignItems: 'center', marginTop: 8, marginBottom: 24, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  buttonDisabled: { opacity: 0.7 },
  loginButtonText: { color: COLORS.white, fontSize: 17, fontWeight: 'bold' },
  registerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  registerPrompt: { fontSize: 15, color: COLORS.gray },
  registerLink: { fontSize: 15, color: COLORS.primary, fontWeight: 'bold' },
});