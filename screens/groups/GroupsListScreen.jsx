import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useMemo, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  Layout,
  ZoomIn,
} from "react-native-reanimated";
import AnimatedView from "../../components/AnimatedView";
import CustomAlert from "../../components/CustomAlert";
import GroupCard from "../../components/GroupCard";
import { useAuth } from "../../context/AuthContext";
import { useAlert } from "../../hooks/useAlert";
import { groupService } from "../../services/authService";
import { COLORS } from "../../utils/constants";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { RectButton } from "react-native-gesture-handler";

const ACCENT = "#6C63FF";
const ACCENT2 = "#43C6AC";
const BG = "#F4F5FA";

const DEMO_CHART_DATA = {
  labels: ["Trip", "Rent", "Dining", "Office", "Gym"],
  datasets: [
    {
      data: [4500, 12000, 3200, 5800, 2100],
    },
  ],
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good Morning", emoji: "☀️" };
  if (hour < 17) return { text: "Good Afternoon", emoji: "🌤️" };
  return { text: "Good Evening", emoji: "🌙" };
}

function getFirstName(name = "") {
  return name.split(" ")[0] || "there";
}

export default function GroupsListScreen({ navigation }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { logout, user } = useAuth();
  const { alertProps, showAlert } = useAlert();
  const insets = useSafeAreaInsets();

  const fetchGroups = async () => {
    try {
      const response = await groupService.getUserGroups();
      setGroups(response.data);
    } catch (error) {
      showAlert({
        type: "error",
        title: "Error",
        message: "Failed to fetch groups",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDeleteGroup = (group) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showAlert({
      type: "confirm",
      title: "Delete Group",
      message: `Are you sure you want to delete "${group.name}"? This action cannot be undone.`,
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await groupService.deleteGroup(group._id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              fetchGroups();
            } catch (error) {
              showAlert({
                type: "error",
                title: "Error",
                message: "Failed to delete group",
              });
            }
          },
        },
      ],
    });
  };

  const renderRightActions = (group) => {
    return (
      <View style={styles.rightActions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#FFC107" }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate("CreateGroup", { group });
          }}
        >
          <Ionicons name="pencil" size={22} color="#FFF" />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: COLORS.danger }]}
          onPress={() => handleDeleteGroup(group)}
        >
          <Ionicons name="trash-outline" size={22} color="#FFF" />
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  };

  React.useEffect(() => {
    navigation.setOptions({
      headerShown: false, // We draw our own header
    });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchGroups();
  };

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    return groups.filter((g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [groups, searchQuery]);

  const overallTotalExpense = useMemo(() => {
    return groups.reduce((acc, g) => acc + (g.totalExpense || 0), 0);
  }, [groups]);

  const totalMembers = useMemo(
    () => groups.reduce((acc, g) => acc + (g.members?.length ?? 0), 0),
    [groups],
  );

  /* ── Loading state ─────────────────────────────────────────── */

  /* ── Loading state ─────────────────────────────────────────── */
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={ACCENT}
          translucent
        />
        <LinearGradient
          colors={[ACCENT, ACCENT2]}
          style={styles.loadingGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <ActivityIndicator size="large" color="#FFF" />
          <Text style={styles.loadingText}>Loading groups…</Text>
        </LinearGradient>
      </View>
    );
  }

  /* ── Main render ───────────────────────────────────────────── */
  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={ACCENT}
        translucent
      />
      <CustomAlert {...alertProps} />

      {/* ── Hero Header ─────────────────────────────────────── */}
      <LinearGradient
        colors={[ACCENT, ACCENT2]}
        style={[styles.header, { paddingTop: insets.top + 14 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Top row: title + logout */}
        <AnimatedView entering={FadeInDown.duration(400)}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerLabel}>
                {getGreeting().emoji} {getGreeting().text}
              </Text>
              <Text style={styles.headerTitle}>
                {getFirstName(user?.name)} 👋
              </Text>
            </View>
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                showAlert({
                  type: "confirm",
                  title: "Logout",
                  message: "Are you sure you want to logout?",
                  buttons: [
                    { text: "Cancel", style: "cancel" },
                    { text: "Logout", style: "destructive", onPress: logout },
                  ],
                });
              }}
            >
              <Ionicons name="log-out-outline" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>
        </AnimatedView>

        {/* Stats pills */}
        <AnimatedView entering={FadeInDown.duration(450).delay(80)}>
          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <Ionicons name="people" size={14} color="#FFF" />
              <Text style={styles.statNum}>{groups.length}</Text>
              <Text style={styles.statLabel}>Groups</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statPill}>
              <Ionicons name="person" size={14} color="#FFF" />
              <Text style={styles.statNum}>{totalMembers}</Text>
              <Text style={styles.statLabel}>Members</Text>
            </View>
          </View>
        </AnimatedView>

        {/* Search bar */}
        <AnimatedView entering={FadeInDown.duration(480).delay(140)}>
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color={ACCENT} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search groups…"
              placeholderTextColor="#AAA"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color="#CCC" />
              </TouchableOpacity>
            )}
          </View>
        </AnimatedView>
      </LinearGradient>

      {/* ── List ────────────────────────────────────────────── */}
      <FlatList
        data={filteredGroups}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          filteredGroups.length === 0 ? styles.emptyList : styles.listContent
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[ACCENT]}
            tintColor={ACCENT}
          />
        }
        renderItem={({ item, index }) => (
          <AnimatedView
            entering={FadeInDown.duration(350).delay(index * 55)}
            layout={Layout.springify()}
          >
            <Swipeable
              renderRightActions={() => renderRightActions(item)}
              friction={2}
              rightThreshold={40}
            >
              <GroupCard
                group={item}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.navigate("GroupDetails", { groupId: item._id });
                }}
              />
            </Swipeable>
          </AnimatedView>
        )}
        ListHeaderComponent={
          <>
            {filteredGroups.length > 0 ? (
              <AnimatedView entering={FadeIn.duration(300)}>
                <Text style={styles.sectionLabel}>
                  {searchQuery
                    ? `${filteredGroups.length} result${filteredGroups.length !== 1 ? "s" : ""}`
                    : "All Groups"}
                </Text>
              </AnimatedView>
            ) : null}
          </>
        }
        ListEmptyComponent={
          <AnimatedView
            entering={FadeInUp.duration(500)}
            style={styles.emptyContainer}
          >
            {/* Glow circle */}
            <View style={styles.emptyGlow}>
              <LinearGradient
                colors={[ACCENT + "40", ACCENT2 + "20"]}
                style={styles.emptyGlowInner}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="people-outline" size={52} color={ACCENT} />
              </LinearGradient>
            </View>

            <Text style={styles.emptyTitle}>
              {searchQuery ? "No matches found" : "No Groups Yet"}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? `No group matched "${searchQuery}". Try a different name.`
                : "Tap the + button below to create your first group and start splitting expenses with friends."}
            </Text>

            {!searchQuery && (
              <TouchableOpacity
                style={styles.emptyAction}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  navigation.navigate("CreateGroup");
                }}
              >
                <LinearGradient
                  colors={[ACCENT, ACCENT2]}
                  style={styles.emptyActionGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="add" size={18} color="#FFF" />
                  <Text style={styles.emptyActionText}>Create Group</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </AnimatedView>
        }
      />

      {/* ── FAB ─────────────────────────────────────────────── */}
      <AnimatedView
        entering={ZoomIn.duration(400).delay(300)}
        style={[styles.fabContainer, { bottom: insets.bottom + 75 }]}
      >
        {/* Pulse ring */}
        <View style={styles.fabPulse} />
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            navigation.navigate("CreateGroup");
          }}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[ACCENT, ACCENT2]}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="add" size={32} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </AnimatedView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  /* Loading */
  loadingContainer: { flex: 1 },
  loadingGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: { color: "#FFF", fontSize: 15, fontWeight: "600" },

  /* Header – paddingTop is set dynamically via insets in JSX */
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 14,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerStatsCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  statLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  statValue: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "800",
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  logoutBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  /* Stats row */
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: "flex-start",
    gap: 16,
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statNum: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFF",
  },

  /* Search */
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1A1A2E",
    fontWeight: "500",
  },

  /* List */
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#888",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 4,
  },
  listContent: { paddingTop: 4, paddingBottom: 110 },
  emptyList: { flexGrow: 1, justifyContent: "center" },

  /* Empty state */
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 36,
  },
  emptyGlow: {
    marginBottom: 24,
  },
  emptyGlowInner: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1A1A2E",
    marginBottom: 10,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 15,
    color: "#888",
    textAlign: "center",
    lineHeight: 23,
    marginBottom: 28,
  },
  emptyAction: {
    borderRadius: 14,
    overflow: "hidden",
  },
  emptyActionGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  emptyActionText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFF",
  },

  /* FAB */
  /* FAB */
  fabContainer: {
    position: "absolute",
    right: 22,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  fabPulse: {
    position: "absolute",
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: ACCENT + "20",
  },
  fab: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: ACCENT,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  fabGradient: {
    flex: 1,
    borderRadius: 31,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },

  /* Actions */
  rightActions: {
    flexDirection: "row",
    height: "100%",
    paddingVertical: 10, // Match GroupCard marginVertical
    paddingRight: 16,
    borderRadius: 24,
    overflow: "hidden",
  },
  actionBtn: {
    width: 75,
    justifyContent: "center",
    alignItems: "center",
  },
  actionText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
});
