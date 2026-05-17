import { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { userService } from "../../services/authService";
import { COLORS } from "../../utils/constants";
import { storage } from "../../utils/storage";
import { FadeInDown } from "react-native-reanimated";
import AnimatedView from "../../components/AnimatedView";
import * as Haptics from "expo-haptics";
import CustomAlert from "../../components/CustomAlert";
import { useAlert } from "../../hooks/useAlert";
import LoadingSpinner from "../../components/LoadingSpinner";

export default function ProfileScreen({ navigation }) {
  const { user, updateUser, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const { alertProps, showAlert } = useAlert();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      setLoading(true);
      const data = await userService.getUserProfile();
      const userData = data.user || data;
      updateUser(userData);
    } catch (error) {
      const localUser = await storage.getUser();
      if (localUser) {
        updateUser(localUser);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showAlert({
      type: "confirm",
      title: "Logout",
      message: "Are you sure you want to logout?",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            logout();
          },
        },
      ],
    });
  };

  if (loading) {
    return <LoadingSpinner message="Loading your profile..." />;
  }

  if (!user) return null;

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <ScrollView
      style={styles.root}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.gradientStart}
        translucent
      />
      <CustomAlert {...alertProps} />

      {/* Gradient Hero Header */}
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        style={[styles.hero, { paddingTop: insets.top + 24 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <AnimatedView
          entering={FadeInDown.duration(500).delay(100)}
          style={styles.heroInner}
        >
          {/* Avatar ring */}
          <View style={styles.avatarRing}>
            <View style={styles.avatarCircle}>
              {user.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{initials}</Text>
              )}
            </View>
          </View>

          <Text style={styles.heroName}>{user.name}</Text>

          <View style={styles.pillsContainer}>
            <View style={styles.activePill}>
              <Ionicons name="checkmark-circle" size={14} color="#FFF" />
              <Text style={styles.activePillText}>Active Member</Text>
            </View>
            <TouchableOpacity
              style={styles.walletHeroPill}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate("Wallet");
              }}
            >
              <Ionicons name="wallet" size={14} color="#FFF" />
              <Text style={styles.activePillText}>
                ₹{user.walletBalance || 0}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.heroDetailsContainer}>
            <Text style={styles.heroDetailText}>@{user.username}</Text>
            <View style={styles.heroDetailDivider} />
            <Text style={styles.heroDetailText}>{user.email}</Text>
          </View>
        </AnimatedView>
      </LinearGradient>

      {/* Main Settings Card */}
      <AnimatedView
        entering={FadeInDown.duration(450).delay(150)}
        style={styles.section}
      >
        <Text style={styles.sectionTitle}>Account & Settings</Text>
        <View style={styles.infoCard}>
          {/* Preferences Group */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate("EditProfile", { user });
            }}
          >
            <View
              style={[
                styles.infoIconBox,
                { backgroundColor: "#4A90E2" + "18" },
              ]}
            >
              <Ionicons name="pencil-outline" size={20} color="#4A90E2" />
            </View>
            <Text style={styles.menuText}>Edit Profile</Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color="#C0C0C0"
            />
          </TouchableOpacity>

          <View style={styles.infoDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate("Security");
            }}
          >
            <View
              style={[
                styles.infoIconBox,
                { backgroundColor: "#50E3C2" + "18" },
              ]}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color="#50E3C2"
              />
            </View>
            <Text style={styles.menuText}>Security & Password</Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color="#C0C0C0"
            />
          </TouchableOpacity>

          <View style={styles.infoDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate("Notifications");
            }}
          >
            <View
              style={[
                styles.infoIconBox,
                { backgroundColor: "#F5A623" + "18" },
              ]}
            >
              <Ionicons
                name="notifications-outline"
                size={20}
                color="#F5A623"
              />
            </View>
            <Text style={styles.menuText}>Notifications</Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color="#C0C0C0"
            />
          </TouchableOpacity>

          <View style={styles.infoDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate("Wallet");
            }}
          >
            <View
              style={[
                styles.infoIconBox,
                { backgroundColor: "#A855F7" + "18" },
              ]}
            >
              <Ionicons name="wallet-outline" size={20} color="#A855F7" />
            </View>
            <Text style={styles.menuText}>My Wallet</Text>
            <View style={styles.walletBadge}>
              <Text style={styles.walletBadgeText}>
                ₹{user.walletBalance || 0}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color="#C0C0C0"
            />
          </TouchableOpacity>

          <View style={styles.infoDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate("ReferAndEarn");
            }}
          >
            <View
              style={[
                styles.infoIconBox,
                { backgroundColor: "#FF2D55" + "18" },
              ]}
            >
              <Ionicons name="gift-outline" size={20} color="#FF2D55" />
            </View>
            <Text style={styles.menuText}>Refer & Earn</Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color="#C0C0C0"
            />
          </TouchableOpacity>

          <View style={styles.infoDivider} />

          {/* Support Group */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate("HelpCenter");
            }}
          >
            <View
              style={[
                styles.infoIconBox,
                { backgroundColor: COLORS.primary + "18" },
              ]}
            >
              <Ionicons
                name="help-circle-outline"
                size={20}
                color={COLORS.primary}
              />
            </View>
            <Text style={styles.menuText}>Help Center</Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color="#C0C0C0"
            />
          </TouchableOpacity>

          <View style={styles.infoDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate("TermsOfService");
            }}
          >
            <View
              style={[
                styles.infoIconBox,
                { backgroundColor: COLORS.secondary + "18" },
              ]}
            >
              <Ionicons
                name="document-text-outline"
                size={20}
                color={COLORS.secondary}
              />
            </View>
            <Text style={styles.menuText}>Terms of Service</Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color="#C0C0C0"
            />
          </TouchableOpacity>

          <View style={styles.infoDivider} />

          {/* Logout */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.infoIconBox,
                { backgroundColor: COLORS.danger + "18" },
              ]}
            >
              <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
            </View>
            <Text style={[styles.menuText, { color: COLORS.danger }]}>
              Logout
            </Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={COLORS.danger + "80"}
            />
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F4F5FA",
  },

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
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarText: { fontSize: 36, fontWeight: "800", color: "#FFF" },
  heroName: { fontSize: 24, fontWeight: "800", color: "#FFF", marginBottom: 4 },
  heroUsername: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
    marginBottom: 2,
  },
  heroEmail: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    marginBottom: 16,
  },
  activePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  activePillText: { fontSize: 13, color: "#FFF", fontWeight: "600" },
  pillsContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  walletHeroPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },

  heroDetailsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  heroDetailText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "500",
  },
  heroDetailDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.4)",
  },

  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.gray,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
  },
  infoIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: { flex: 1 },
  infoLabel: {
    fontSize: 11,
    color: COLORS.gray,
    marginBottom: 2,
    fontWeight: "500",
  },
  infoValue: { fontSize: 15, color: COLORS.dark, fontWeight: "600" },
  infoDivider: { height: 1, backgroundColor: "#F0F2F5", marginHorizontal: 4 },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 14,
  },
  menuText: { flex: 1, fontSize: 15, fontWeight: "600", color: "#1A1A2E" },
  walletBadge: {
    backgroundColor: "rgba(168, 85, 247, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  walletBadgeText: {
    color: "#A855F7",
    fontSize: 13,
    fontWeight: "700",
  },
});
