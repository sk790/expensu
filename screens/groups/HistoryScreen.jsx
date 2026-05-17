import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
  ZoomIn,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import AnimatedView from "../../components/AnimatedView";
import { useAuth } from "../../context/AuthContext";
import { groupService } from "../../services/authService";
import { COLORS, SHADOWS } from "../../utils/constants";

const { width } = Dimensions.get("window");

const CATEGORY_COLORS = [
  "#6C63FF", "#FF6584", "#43A047", "#FB8C00", "#00ACC1",
  "#8E24AA", "#E53935", "#1E88E5", "#F4511E", "#00897B",
];

const getCategoryColor = (str = "") => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length];
};

const getInitials = (name = "") => (name ? name.substring(0, 2).toUpperCase() : "?");

const formatExpenseDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function HistoryScreen() {
  const navigation = useNavigation();
  const { user: currentUser } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("All");

  const currentUserId = currentUser?.id || currentUser?._id;

  const fetchAllHistory = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await groupService.getUserExpenses();
      if (res.success && res.data) {
        // Filter out settlement payments registered as expenses
        const filtered = res.data.filter(
          (exp) => exp.description !== "Settlement"
        );
        setExpenses(filtered);
      }
    } catch (error) {
      console.error("Failed to load user expenses history:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAllHistory(true);
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchAllHistory(false);
  };

  // Get all unique months available in expenses for filter pills
  const availableMonths = useMemo(() => {
    const months = new Set();
    expenses.forEach((exp) => {
      if (!exp.createdAt) return;
      const date = new Date(exp.createdAt);
      const label = date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      months.add(label);
    });
    return ["All", ...Array.from(months).sort((a, b) => new Date(b) - new Date(a))];
  }, [expenses]);

  // Handle fallback if currently selected month disappears from list after refresh
  useEffect(() => {
    if (availableMonths.length > 0 && !availableMonths.includes(selectedMonth)) {
      setSelectedMonth("All");
    }
  }, [availableMonths, selectedMonth]);

  // Filtered expenses based on search query AND month filter
  const filteredExpenses = useMemo(() => {
    let result = expenses;

    // 1. Month Filter
    if (selectedMonth !== "All") {
      result = result.filter((exp) => {
        if (!exp.createdAt) return false;
        const date = new Date(exp.createdAt);
        const label = date.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });
        return label === selectedMonth;
      });
    }

    // 2. Search Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (exp) =>
          exp.description.toLowerCase().includes(query) ||
          (exp.groupId?.name && exp.groupId.name.toLowerCase().includes(query))
      );
    }

    return result;
  }, [expenses, selectedMonth, searchQuery]);

  // Group expenses month-wise
  const monthGroups = useMemo(() => {
    const groups = {};
    filteredExpenses.forEach((exp) => {
      if (!exp.createdAt) return;
      const date = new Date(exp.createdAt);
      const monthYear = date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(exp);
    });

    // Sort months chronologically descending
    return Object.keys(groups)
      .sort((a, b) => new Date(b) - new Date(a))
      .reduce((acc, key) => {
        acc[key] = groups[key];
        return acc;
      }, {});
  }, [filteredExpenses]);

  // Calculations for stats hero card
  const stats = useMemo(() => {
    let label = "";
    let totalAmount = 0;
    let youPaid = 0;
    let yourShare = 0;

    if (selectedMonth === "All") {
      label = "All-Time Overview";
      expenses.forEach((exp) => {
        const perPerson = exp.amount / (exp.splitBetween?.length || 1);
        const isPaidByMe = exp.paidBy?._id === currentUserId;
        const isSplitWithMe = exp.splitBetween?.some((m) => m._id === currentUserId);

        totalAmount += exp.amount;
        if (isPaidByMe) {
          youPaid += exp.amount;
        }
        if (isSplitWithMe) {
          yourShare += perPerson;
        }
      });
    } else {
      label = `${selectedMonth} Overview`;
      expenses.forEach((exp) => {
        if (!exp.createdAt) return;
        const date = new Date(exp.createdAt);
        const expMonthLabel = date.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });

        if (expMonthLabel === selectedMonth) {
          const perPerson = exp.amount / (exp.splitBetween?.length || 1);
          const isPaidByMe = exp.paidBy?._id === currentUserId;
          const isSplitWithMe = exp.splitBetween?.some((m) => m._id === currentUserId);

          totalAmount += exp.amount;
          if (isPaidByMe) {
            youPaid += exp.amount;
          }
          if (isSplitWithMe) {
            yourShare += perPerson;
          }
        }
      });
    }

    return {
      label,
      totalAmount,
      youPaid,
      yourShare,
    };
  }, [expenses, selectedMonth, currentUserId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Fetching history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.topHeader}>
        <Text style={styles.mainTitle}>Expenses History</Text>
        <Text style={styles.subtitle}>Track your overall splits across all groups</Text>

        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={20} color={COLORS.gray} style={styles.searchIcon} />
          <TextInput
            placeholder="Search by description or group..."
            placeholderTextColor={COLORS.gray}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={COLORS.gray} />
            </TouchableOpacity>
          )}
        </View>

        {/* Dynamic Month Horizontal Filters */}
        {availableMonths.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.monthScrollContainer}
          >
            {availableMonths.map((m) => {
              const isActive = selectedMonth === m;
              return (
                <TouchableOpacity
                  key={m}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedMonth(m);
                  }}
                  style={[
                    styles.monthPill,
                    isActive && styles.monthPillActive,
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.monthPillText,
                      isActive && styles.monthPillTextActive,
                    ]}
                  >
                    {m}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Stats Hero Card */}
        {!searchQuery && (
          <AnimatedView entering={FadeInDown.duration(400).delay(100)} style={styles.heroCard}>
            <LinearGradient
              colors={[COLORS.gradientStart, COLORS.gradientEnd]}
              style={styles.heroGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.heroHeader}>
                <Ionicons name="wallet-outline" size={24} color={COLORS.white} />
                <Text style={styles.heroTitle}>{stats.label}</Text>
              </View>

              <View style={styles.heroRow}>
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatValue}>₹{stats.yourShare.toFixed(2)}</Text>
                  <Text style={styles.heroStatLabel}>Your Net Share</Text>
                </View>
                <View style={styles.heroDivider} />
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatValue}>₹{stats.youPaid.toFixed(2)}</Text>
                  <Text style={styles.heroStatLabel}>Total Paid By You</Text>
                </View>
              </View>

              <View style={styles.heroFooter}>
                <Text style={styles.heroFooterText}>
                  {selectedMonth === "All" ? "Aggregated for all transactions" : `Aggregated for ${selectedMonth}`}
                </Text>
              </View>
            </LinearGradient>
          </AnimatedView>
        )}

        {/* Expenses List */}
        {expenses.length === 0 ? (
          <AnimatedView entering={FadeInDown.duration(400).delay(200)} style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
              <Ionicons name="receipt-outline" size={44} color={COLORS.gray} />
            </View>
            <Text style={styles.emptyTitle}>No Expenses Recorded</Text>
            <Text style={styles.emptySubtext}>
              Once you add expenses inside any group, your monthly chronological transactions will appear here!
            </Text>
          </AnimatedView>
        ) : filteredExpenses.length === 0 ? (
          <AnimatedView entering={FadeInDown.duration(400)} style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
              <Ionicons name="search" size={44} color={COLORS.gray} />
            </View>
            <Text style={styles.emptyTitle}>No Match Found</Text>
            <Text style={styles.emptySubtext}>
              We couldn't find any transactions matching "{searchQuery}". Try searching for a different keyword.
            </Text>
          </AnimatedView>
        ) : (
          Object.keys(monthGroups).map((monthName, mIndex) => (
            <AnimatedView
              key={monthName}
              entering={FadeInDown.duration(400).delay(mIndex * 100)}
              style={styles.monthSection}
            >
              {/* Month Header */}
              <View style={styles.monthHeaderRow}>
                <Text style={styles.monthTitle}>{monthName}</Text>
                <View style={styles.monthBadge}>
                  <Text style={styles.monthBadgeText}>
                    {monthGroups[monthName].length} item{monthGroups[monthName].length !== 1 ? "s" : ""}
                  </Text>
                </View>
              </View>

              {/* Month Items */}
              {monthGroups[monthName].map((expense, eIndex) => {
                const accentColor = getCategoryColor(expense.description);
                const isPaidByMe = expense.paidBy?._id === currentUserId;
                const perPerson = expense.amount / (expense.splitBetween?.length || 1);
                const isSplitWithMe = expense.splitBetween?.some((m) => m._id === currentUserId);

                return (
                  <AnimatedView
                    key={expense._id}
                    entering={ZoomIn.duration(300).delay(eIndex * 50)}
                    layout={Layout.springify()}
                  >
                    <TouchableOpacity
                      style={styles.expenseCard}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        navigation.navigate("Groups", {
                          screen: "ExpenseDetail",
                          params: {
                            expense,
                            groupId: expense.groupId?._id || expense.groupId,
                          },
                        });
                      }}
                      activeOpacity={0.8}
                    >
                      {/* Left accent bar */}
                      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

                      <View style={styles.cardInner}>
                        {/* Top Metadata Row */}
                        <View style={styles.cardHeaderRow}>
                          <View style={[styles.iconCircle, { backgroundColor: accentColor + "12" }]}>
                            <MaterialIcons name="receipt-long" size={20} color={accentColor} />
                          </View>
                          
                          <View style={styles.cardDescBlock}>
                            <Text style={styles.cardDescription} numberOfLines={1}>
                              {expense.description}
                            </Text>
                            
                            {/* Group name indicator badge */}
                            <View style={styles.groupBadgeContainer}>
                              <View style={[styles.groupBadge, { backgroundColor: COLORS.primary + "10" }]}>
                                <Ionicons name="people-outline" size={10} color={COLORS.primary} />
                                <Text style={styles.groupBadgeText} numberOfLines={1}>
                                  {expense.groupId?.name || "Unknown Group"}
                                </Text>
                              </View>
                            </View>
                          </View>

                          <View style={styles.amountBlock}>
                            <Text style={styles.totalAmount}>₹{Number(expense.amount).toFixed(2)}</Text>
                            {isSplitWithMe ? (
                              <Text style={styles.shareAmount}>
                                Your Share: ₹{perPerson.toFixed(2)}
                              </Text>
                            ) : (
                              <Text style={styles.shareAmountZero}>Not in Split</Text>
                            )}
                          </View>
                        </View>

                        {/* Divider */}
                        <View style={styles.cardDivider} />

                        {/* Bottom Information Row */}
                        <View style={styles.cardBottomRow}>
                          <View style={styles.payerMetaChip}>
                            {expense.paidBy?.avatar ? (
                              <Image source={{ uri: expense.paidBy.avatar }} style={styles.payerAvatar} />
                            ) : (
                              <View style={[styles.payerAvatarFallback, { backgroundColor: COLORS.primary + "18" }]}>
                                <Text style={styles.payerAvatarText}>
                                  {getInitials(expense.paidBy?.name)}
                                </Text>
                              </View>
                            )}
                            <Text style={styles.payerLabel} numberOfLines={1}>
                              {isPaidByMe ? "Paid by You" : `Paid by ${expense.paidBy?.name?.split(" ")[0] || "Someone"}`}
                            </Text>
                          </View>

                          <Text style={styles.dateLabel}>
                            {formatExpenseDate(expense.createdAt)}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </AnimatedView>
                );
              })}
            </AnimatedView>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: COLORS.gray,
    fontWeight: "600",
  },
  topHeader: {
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.dark,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 4,
    fontWeight: "500",
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F5FA",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 16,
  },
  monthScrollContainer: {
    flexDirection: "row",
    marginTop: 14,
    gap: 8,
    paddingBottom: 2,
  },
  monthPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F4F5FA",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  monthPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  monthPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.gray,
  },
  monthPillTextActive: {
    color: COLORS.white,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.dark,
    paddingVertical: 0,
  },
  scrollContent: {
    padding: 16,
  },
  heroCard: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 24,
    ...SHADOWS.medium,
  },
  heroGradient: {
    padding: 20,
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  heroTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  heroStatItem: {
    flex: 1,
    alignItems: "center",
  },
  heroStatValue: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 4,
  },
  heroStatLabel: {
    color: COLORS.white + "B0",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  heroDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.white + "30",
  },
  heroFooter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.white + "20",
    paddingTop: 12,
    marginTop: 16,
    alignItems: "center",
  },
  heroFooterText: {
    color: COLORS.white + "90",
    fontSize: 12,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingVertical: 48,
    paddingHorizontal: 24,
    marginTop: 20,
    ...SHADOWS.soft,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: COLORS.gray,
    textAlign: "center",
    lineHeight: 20,
  },
  monthSection: {
    marginBottom: 24,
  },
  monthHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  monthTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.dark,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  monthBadge: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  monthBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.gray,
  },
  expenseCard: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    ...SHADOWS.soft,
  },
  accentBar: {
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  cardInner: {
    flex: 1,
    padding: 12,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  cardDescBlock: {
    flex: 1,
    marginRight: 8,
  },
  cardDescription: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.dark,
    marginBottom: 4,
  },
  groupBadgeContainer: {
    flexDirection: "row",
  },
  groupBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    maxWidth: 140,
  },
  groupBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.primary,
  },
  amountBlock: {
    alignItems: "flex-end",
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 2,
  },
  shareAmount: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "600",
  },
  shareAmountZero: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: "500",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 10,
  },
  cardBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  payerMetaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  payerAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#F3F4F6",
  },
  payerAvatarFallback: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  payerAvatarText: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.primary,
  },
  payerLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
    maxWidth: 120,
  },
  dateLabel: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: "500",
  },
});
