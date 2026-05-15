import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View, ScrollView, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { userService } from "../../services/authService";
import { COLORS } from "../../utils/constants";
import { storage } from "../../utils/storage";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import AnimatedView from "../../components/AnimatedView";
import * as Haptics from "expo-haptics";
import CustomAlert from "../../components/CustomAlert";
import { useAlert } from "../../hooks/useAlert";

export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const { alertProps, showAlert } = useAlert();

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
    showAlert({ type: "confirm", title: "Logout", message: "Are you sure you want to logout?", buttons: [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); logout(); } },
    ]});
  };

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  if (!user) return null;

  const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : "U";

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <CustomAlert {...alertProps} />

      {/* Profile Header */}
      <AnimatedView entering={FadeInDown.duration(500).delay(100)} style={styles.header}>
        <View style={styles.avatarGradientRing}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>
        <Text style={styles.name}>{user.name}</Text>
        {user.username && <Text style={styles.username}>@{user.username}</Text>}
        <Text style={styles.email}>{user.email}</Text>

        <View style={styles.statRow}>
          <View style={styles.statPill}>
            <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.success} />
            <Text style={styles.statText}>Active Member</Text>
          </View>
        </View>
      </AnimatedView>

      {/* Info Section */}
      <AnimatedView entering={FadeInDown.duration(500).delay(200)} style={styles.infoCard}>
        <Text style={styles.infoSectionTitle}>Account Info</Text>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={18} color={COLORS.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Full Name</Text>
            <Text style={styles.infoValue}>{user.name}</Text>
          </View>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={18} color={COLORS.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email Address</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>
        </View>
      </AnimatedView>

      {/* Menu Items */}
      <AnimatedView entering={FadeInUp.duration(500).delay(300)} style={styles.menuCard}>
        <TouchableOpacity style={styles.menuItem} onPress={handleLogout} activeOpacity={0.7}>
          <View style={[styles.menuIconBox, { backgroundColor: COLORS.danger + '15' }]}>
            <Ionicons name="log-out-outline" size={22} color={COLORS.danger} />
          </View>
          <Text style={[styles.menuText, { color: COLORS.danger }]}>Logout</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.danger + '80'} />
        </TouchableOpacity>
      </AnimatedView>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  scrollContent: { padding: 20 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8F9FA" },
  header: { backgroundColor: COLORS.white, borderRadius: 24, padding: 28, alignItems: "center", marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 4 },
  avatarGradientRing: { padding: 4, borderRadius: 56, backgroundColor: COLORS.primary + '30', marginBottom: 16 },
  avatarContainer: { width: 96, height: 96, borderRadius: 48, backgroundColor: COLORS.primary, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 38, fontWeight: "bold", color: COLORS.white },
  name: { fontSize: 24, fontWeight: "bold", color: COLORS.dark, marginBottom: 4 },
  username: { fontSize: 14, color: COLORS.primary, fontWeight: "600", marginBottom: 4 },
  email: { fontSize: 15, color: COLORS.gray, marginBottom: 16 },
  statRow: { flexDirection: "row", gap: 10 },
  statPill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: COLORS.success + '15', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  statText: { fontSize: 13, color: COLORS.success, fontWeight: "600" },
  infoCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  infoSectionTitle: { fontSize: 14, fontWeight: "700", color: COLORS.gray, marginBottom: 16, textTransform: "uppercase", letterSpacing: 0.5 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, color: COLORS.gray, marginBottom: 2, fontWeight: "500" },
  infoValue: { fontSize: 16, color: COLORS.dark, fontWeight: "600" },
  infoDivider: { height: 1, backgroundColor: "#F0F0F0", marginVertical: 14 },
  menuCard: { backgroundColor: COLORS.white, borderRadius: 20, paddingVertical: 4, paddingHorizontal: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 12, borderRadius: 14 },
  menuIconBox: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 14 },
  menuText: { flex: 1, fontSize: 16, fontWeight: "600" },
});
