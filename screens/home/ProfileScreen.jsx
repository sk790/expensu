import { useEffect, useState } from "react";
import {
  StyleSheet, Text, TouchableOpacity, View,
  ScrollView, ActivityIndicator, StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { userService } from "../../services/authService";
import { COLORS } from "../../utils/constants";
import { storage } from "../../utils/storage";
import { FadeInDown, FadeInUp } from "react-native-reanimated";
import AnimatedView from "../../components/AnimatedView";
import * as Haptics from "expo-haptics";
import CustomAlert from "../../components/CustomAlert";
import { useAlert } from "../../hooks/useAlert";

export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const { alertProps, showAlert } = useAlert();
  const insets = useSafeAreaInsets();

  useEffect(() => { loadUser(); }, []);

  const loadUser = async () => {
    try {
      setLoading(true);
      const data = await userService.getUserProfile();
      const userData = data.user || data;
      setUser(userData);
      await storage.setUser(userData);
    } catch (error) {
      const localUser = await storage.getUser();
      setUser(localUser);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showAlert({
      type: "confirm", title: "Logout",
      message: "Are you sure you want to logout?",
      buttons: [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          logout();
        }},
      ],
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.gradientStart} translucent />
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!user) return null;

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : "U";

  return (
    <ScrollView
      style={styles.root}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.gradientStart} translucent />
      <CustomAlert {...alertProps} />

      {/* Gradient Hero Header */}
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        style={[styles.hero, { paddingTop: insets.top + 24 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <AnimatedView entering={FadeInDown.duration(500).delay(100)} style={styles.heroInner}>
          {/* Avatar ring */}
          <View style={styles.avatarRing}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
          <Text style={styles.heroName}>{user.name}</Text>
          {user.username && <Text style={styles.heroUsername}>@{user.username}</Text>}
          <Text style={styles.heroEmail}>{user.email}</Text>

          <View style={styles.activePill}>
            <Ionicons name="checkmark-circle" size={14} color="#FFF" />
            <Text style={styles.activePillText}>Active Member</Text>
          </View>
        </AnimatedView>
      </LinearGradient>

      {/* Account Info card */}
      <AnimatedView entering={FadeInDown.duration(450).delay(150)} style={styles.section}>
        <Text style={styles.sectionTitle}>Account Info</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={[styles.infoIconBox, { backgroundColor: COLORS.primary + "18" }]}>
              <Ionicons name="person-outline" size={18} color={COLORS.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>{user.name}</Text>
            </View>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <View style={[styles.infoIconBox, { backgroundColor: COLORS.secondary + "18" }]}>
              <Ionicons name="mail-outline" size={18} color={COLORS.secondary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email Address</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
          </View>
        </View>
      </AnimatedView>

      {/* Actions */}
      <AnimatedView entering={FadeInUp.duration(450).delay(250)} style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <View style={styles.infoCard}>
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout} activeOpacity={0.7}>
            <View style={[styles.infoIconBox, { backgroundColor: COLORS.danger + "18" }]}>
              <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
            </View>
            <Text style={[styles.menuText, { color: COLORS.danger }]}>Logout</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.danger + "80"} />
          </TouchableOpacity>
        </View>
      </AnimatedView>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F4F5FA" },
  scrollContent: { paddingBottom: 20 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F4F5FA" },

  hero: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroInner: { alignItems: "center" },
  avatarRing: {
    padding: 4,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.4)",
  },
  avatarCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center", alignItems: "center",
  },
  avatarText: { fontSize: 36, fontWeight: "800", color: "#FFF" },
  heroName: { fontSize: 24, fontWeight: "800", color: "#FFF", marginBottom: 4 },
  heroUsername: { fontSize: 14, color: "rgba(255,255,255,0.8)", fontWeight: "600", marginBottom: 2 },
  heroEmail: { fontSize: 14, color: "rgba(255,255,255,0.75)", marginBottom: 16 },
  activePill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.3)",
  },
  activePillText: { fontSize: 13, color: "#FFF", fontWeight: "600" },

  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: {
    fontSize: 12, fontWeight: "700", color: COLORS.gray,
    textTransform: "uppercase", letterSpacing: 1,
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: "#FFF", borderRadius: 20, paddingVertical: 4, paddingHorizontal: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 12, elevation: 2,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14 },
  infoIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: COLORS.gray, marginBottom: 2, fontWeight: "500" },
  infoValue: { fontSize: 15, color: COLORS.dark, fontWeight: "600" },
  infoDivider: { height: 1, backgroundColor: "#F0F2F5", marginHorizontal: 4 },

  menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 14, gap: 14 },
  menuText: { flex: 1, fontSize: 15, fontWeight: "600" },
});
