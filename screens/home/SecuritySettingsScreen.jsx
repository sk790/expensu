import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../utils/constants";
import Animated, { FadeInDown } from "react-native-reanimated";
import AnimatedView from "../../components/AnimatedView";
import * as Haptics from "expo-haptics";

export default function SecuritySettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [biometrics, setBiometrics] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const handleToggle = (setter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setter((prev) => !prev);
  };

  const InputField = ({ label, value, onChange, placeholder, isPassword = true }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          secureTextEntry={isPassword}
          placeholderTextColor={COLORS.gray}
        />
        {isPassword && <Ionicons name="eye-off-outline" size={20} color={COLORS.gray} />}
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F5FA" translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
      >
        <AnimatedView entering={FadeInDown.duration(400).delay(100)}>
          <Text style={styles.sectionHeader}>Change Password</Text>
          <View style={styles.card}>
            <InputField
              label="Current Password"
              placeholder="Enter current password"
              value={passwordForm.current}
              onChange={(val) => setPasswordForm({ ...passwordForm, current: val })}
            />
            <View style={styles.divider} />
            <InputField
              label="New Password"
              placeholder="Enter new password"
              value={passwordForm.new}
              onChange={(val) => setPasswordForm({ ...passwordForm, new: val })}
            />
            <View style={styles.divider} />
            <InputField
              label="Confirm New Password"
              placeholder="Confirm new password"
              value={passwordForm.confirm}
              onChange={(val) => setPasswordForm({ ...passwordForm, confirm: val })}
            />

            <TouchableOpacity style={styles.updateBtn} onPress={() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)}>
              <Text style={styles.updateBtnText}>Update Password</Text>
            </TouchableOpacity>
          </View>
        </AnimatedView>

        <AnimatedView entering={FadeInDown.duration(400).delay(300)}>
          <Text style={styles.sectionHeader}>Advanced Security</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={[styles.iconBg, { backgroundColor: "#50E3C2" + "15" }]}>
                <Ionicons name="finger-print-outline" size={22} color="#50E3C2" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Biometric Login</Text>
                <Text style={styles.settingSubtitle}>FaceID or Fingerprint</Text>
              </View>
              <Switch
                trackColor={{ false: "#D1D1D1", true: COLORS.primary + "50" }}
                thumbColor={biometrics ? COLORS.primary : "#F4F3F4"}
                onValueChange={() => handleToggle(setBiometrics)}
                value={biometrics}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={[styles.iconBg, { backgroundColor: "#4A90E2" + "15" }]}>
                <Ionicons name="shield-checkmark-outline" size={22} color="#4A90E2" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Two-Factor Auth</Text>
                <Text style={styles.settingSubtitle}>Extra layer of protection</Text>
              </View>
              <Switch
                trackColor={{ false: "#D1D1D1", true: COLORS.primary + "50" }}
                thumbColor={twoFactor ? COLORS.primary : "#F4F3F4"}
                onValueChange={() => handleToggle(setTwoFactor)}
                value={twoFactor}
              />
            </View>
          </View>
        </AnimatedView>

        <AnimatedView entering={FadeInDown.duration(400).delay(500)}>
          <Text style={styles.sectionHeader}>Active Devices</Text>
          <View style={styles.card}>
            <View style={styles.deviceRow}>
              <Ionicons name="phone-portrait-outline" size={24} color={COLORS.dark} />
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceTitle}>iPhone 15 Pro (Current)</Text>
                <Text style={styles.deviceSubtitle}>Delhi, India • Active now</Text>
              </View>
              <View style={styles.onlineDot} />
            </View>
            <View style={styles.divider} />
            <View style={styles.deviceRow}>
              <Ionicons name="laptop-outline" size={24} color={COLORS.gray} />
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceTitle}>MacBook Pro 14"</Text>
                <Text style={styles.deviceSubtitle}>Delhi, India • 2 days ago</Text>
              </View>
              <TouchableOpacity>
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </AnimatedView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F4F5FA" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 15,
    backgroundColor: "#F4F5FA",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.dark,
  },
  scrollContent: {
    padding: 20,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.gray,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    paddingVertical: 8,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.gray,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9F9FB",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.dark,
  },
  updateBtn: {
    backgroundColor: COLORS.primary,
    margin: 16,
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  updateBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 15,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  settingInfo: {
    flex: 1,
    marginLeft: 16,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.dark,
  },
  settingSubtitle: {
    fontSize: 12,
    color: COLORS.gray,
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginHorizontal: 16,
  },
  deviceRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  deviceInfo: {
    flex: 1,
    marginLeft: 16,
  },
  deviceTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.dark,
  },
  deviceSubtitle: {
    fontSize: 12,
    color: COLORS.gray,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#50E3C2",
  },
  logoutText: {
    fontSize: 13,
    color: COLORS.danger,
    fontWeight: "600",
  },
});
