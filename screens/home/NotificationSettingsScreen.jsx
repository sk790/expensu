import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  Switch,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../utils/constants";
import Animated, { FadeInDown } from "react-native-reanimated";
import AnimatedView from "../../components/AnimatedView";
import * as Haptics from "expo-haptics";

export default function NotificationSettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [settings, setSettings] = useState({
    groupInvite: true,
    newExpense: true,
    expenseSettled: true,
    reminders: false,
    appUpdates: true,
    emailDaily: false,
    emailWeekly: true,
  });

  const toggleSwitch = (key) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const SettingRow = ({ title, subtitle, icon, value, onToggle, color }) => (
    <View style={styles.settingRow}>
      <View style={[styles.iconBg, { backgroundColor: color + "15" }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        trackColor={{ false: "#D1D1D1", true: COLORS.primary + "50" }}
        thumbColor={value ? COLORS.primary : "#F4F3F4"}
        ios_backgroundColor="#D1D1D1"
        onValueChange={onToggle}
        value={value}
      />
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
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
      >
        <AnimatedView entering={FadeInDown.duration(400).delay(100)}>
          <Text style={styles.sectionHeader}>Push Notifications</Text>
          <View style={styles.card}>
            <SettingRow
              title="Group Invitations"
              subtitle="When someone adds you to a group"
              icon="people-outline"
              color="#4A90E2"
              value={settings.groupInvite}
              onToggle={() => toggleSwitch("groupInvite")}
            />
            <View style={styles.divider} />
            <SettingRow
              title="New Expenses"
              subtitle="When a friend adds an expense"
              icon="cash-outline"
              color="#F5A623"
              value={settings.newExpense}
              onToggle={() => toggleSwitch("newExpense")}
            />
            <View style={styles.divider} />
            <SettingRow
              title="Expense Settled"
              subtitle="When someone clears their debt"
              icon="checkmark-circle-outline"
              color="#50E3C2"
              value={settings.expenseSettled}
              onToggle={() => toggleSwitch("expenseSettled")}
            />
            <View style={styles.divider} />
            <SettingRow
              title="Reminders"
              subtitle="Get notified about pending payments"
              icon="alarm-outline"
              color={COLORS.primary}
              value={settings.reminders}
              onToggle={() => toggleSwitch("reminders")}
            />
          </View>
        </AnimatedView>

        <AnimatedView entering={FadeInDown.duration(400).delay(300)}>
          <Text style={styles.sectionHeader}>Email Reports</Text>
          <View style={styles.card}>
            <SettingRow
              title="Daily Summary"
              subtitle="A quick recap of your day's activity"
              icon="mail-outline"
              color={COLORS.secondary}
              value={settings.emailDaily}
              onToggle={() => toggleSwitch("emailDaily")}
            />
            <View style={styles.divider} />
            <SettingRow
              title="Weekly Digest"
              subtitle="Comprehensive weekly spending report"
              icon="stats-chart-outline"
              color="#9B59B6"
              value={settings.emailWeekly}
              onToggle={() => toggleSwitch("emailWeekly")}
            />
          </View>
        </AnimatedView>

        <AnimatedView entering={FadeInDown.duration(400).delay(500)}>
          <Text style={styles.sectionHeader}>App Updates</Text>
          <View style={styles.card}>
            <SettingRow
              title="Product Updates"
              subtitle="New features and improvements"
              icon="rocket-outline"
              color="#E74C3C"
              value={settings.appUpdates}
              onToggle={() => toggleSwitch("appUpdates")}
            />
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
    marginRight: 10,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.dark,
    marginBottom: 2,
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
});
