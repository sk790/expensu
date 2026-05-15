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

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const { register } = useAuth();
  const { alertProps, showAlert } = useAlert();

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
      await register(name, email, password);
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
  ];

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <CustomAlert {...alertProps} />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <AnimatedView entering={FadeInDown.duration(500).delay(100)} style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="person-add" size={40} color={COLORS.white} />
          </View>
          <Text style={styles.appName}>Create Account</Text>
          <Text style={styles.tagline}>Join Expensu and split smartly</Text>
        </AnimatedView>

        <AnimatedView entering={FadeInUp.duration(500).delay(250)} style={styles.card}>
          {fields.map((field, index) => (
            <AnimatedView key={field.key} entering={FadeInDown.duration(300).delay(100 + index * 60)}>
              <View style={[styles.inputWrapper, focusedField === field.key && styles.inputWrapperFocused]}>
                <Ionicons name={field.icon} size={20} color={focusedField === field.key ? COLORS.primary : COLORS.gray} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder={field.label} placeholderTextColor={COLORS.gray} value={field.value} onChangeText={field.setter} keyboardType={field.type} autoCapitalize={field.key === 'name' ? 'words' : 'none'} secureTextEntry={field.secure} editable={!loading} onFocus={() => setFocusedField(field.key)} onBlur={() => setFocusedField(null)} />
                {field.toggleShow && (
                  <TouchableOpacity onPress={field.toggleShow} style={styles.eyeIcon}>
                    <Ionicons name={field.showState ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.gray} />
                  </TouchableOpacity>
                )}
              </View>
            </AnimatedView>
          ))}

          <TouchableOpacity style={[styles.registerButton, loading && styles.buttonDisabled]} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.registerButtonText}>Create Account</Text>}
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.loginPrompt}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={loading}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </AnimatedView>
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  heroSection: { alignItems: 'center', marginBottom: 32 },
  logoContainer: { width: 80, height: 80, borderRadius: 24, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
  appName: { fontSize: 28, fontWeight: 'bold', color: COLORS.dark },
  tagline: { fontSize: 14, color: COLORS.gray, marginTop: 6 },
  card: { backgroundColor: COLORS.white, borderRadius: 24, padding: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 4 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#F0F0F0', borderRadius: 14, backgroundColor: '#FAFAFA', marginBottom: 14, overflow: 'hidden' },
  inputWrapperFocused: { borderColor: COLORS.primary, backgroundColor: COLORS.white },
  inputIcon: { paddingHorizontal: 16 },
  input: { flex: 1, fontSize: 16, color: COLORS.dark, paddingVertical: 16, paddingRight: 12 },
  eyeIcon: { paddingHorizontal: 16 },
  registerButton: { backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: 14, alignItems: 'center', marginTop: 10, marginBottom: 24, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  buttonDisabled: { opacity: 0.7 },
  registerButtonText: { color: COLORS.white, fontSize: 17, fontWeight: 'bold' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  loginPrompt: { fontSize: 15, color: COLORS.gray },
  loginLink: { fontSize: 15, color: COLORS.primary, fontWeight: 'bold' },
});