import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useLayoutEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
  ZoomIn,
} from "react-native-reanimated";
import AnimatedView from "../../components/AnimatedView";
import ExpenseCard from "../../components/ExpenseCard";
import GroupSummaryCard from "../../components/GroupSummaryCard";
import LoadingSpinner from "../../components/LoadingSpinner";
import { groupService } from "../../services/authService";
import { COLORS } from "../../utils/constants";

export default function GroupDetailScreen({ route, navigation }) {
  const { groupId } = route.params;
  const [group, setGroup] = useState();
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [payments, setPayments] = useState([]);
  const [activeTab, setActiveTab] = useState("expenses");
  const [inviteLink, setInviteLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [settleModalVisible, setSettleModalVisible] = useState(false);
  const [settleData, setSettleData] = useState(null);
  const [customSettleAmount, setCustomSettleAmount] = useState("");
  const [settling, setSettling] = useState(false);
  const insets = useSafeAreaInsets();

  const openSettleModal = (data) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSettleData(data);
    setCustomSettleAmount(data.amount.toString());
    setSettleModalVisible(true);
  };

  const handleSettleUp = async () => {
    if (!customSettleAmount || isNaN(customSettleAmount)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSettling(true);
    try {
      await groupService.settleUp(
        groupId,
        settleData.toUser.userId,
        parseFloat(customSettleAmount),
      );

      setSettleModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Payment recorded successfully!");
      fetchExpenses();
      fetchBalances();
      fetchPayments();
    } catch (error) {
      console.log(error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to record settlement");
    } finally {
      setSettling(false);
    }
  };

  const fetchGroupDetails = async () => {
    try {
      const response = await groupService.getGroup(groupId);
      setGroup(response.data);
      setInviteLink(response.inviteLink);
    } catch (error) {
      Alert.alert("Error", "Failed to load group details");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenses = async () => {
    try {
      const response = await groupService.getGroupExpenses(groupId);
      setExpenses(response.data);
    } catch (error) {
      console.log("Failed to fetch expenses:", error);
    }
  };

  const fetchBalances = async () => {
    try {
      const response = await groupService.getGroupBalances(groupId);
      setBalances(response.data.balances || []);
    } catch (error) {
      console.log("Failed to fetch balances:", error);
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await groupService.getGroupSettlements(groupId);
      setPayments(response.data || []);
    } catch (error) {
      console.log("Failed to fetch payments:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchGroupDetails();
      fetchExpenses();
      fetchBalances();
      fetchPayments();
    }, [groupId]),
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: group?.name || "Group Details",
    });
  }, [navigation, group?.name]);

  const switchTab = (tab) => {
    if (activeTab !== tab) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setActiveTab(tab);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading group details..." />;
  }

  return (
    <View style={styles.containerWrapper}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        <AnimatedView entering={FadeInDown.duration(400).delay(100)}>
          <GroupSummaryCard
            group={group}
            totalExpenses={expenses.reduce(
              (sum, expense) => sum + (expense.amount || 0),
              0,
            )}
            onAddMember={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate("AddMember", {
                groupId: groupId,
                currentMembers: group?.members || [],
              });
            }}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate("GroupMembers", {
                groupId: groupId,
                group: group,
                expenses: expenses,
              });
            }}
          />
        </AnimatedView>

        <AnimatedView
          entering={FadeInDown.duration(400).delay(200)}
          style={styles.tabContainer}
        >
          {["expenses", "balances", "payments"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={styles.tabButton}
              onPress={() => switchTab(tab)}
              activeOpacity={0.8}
            >
              {activeTab === tab && (
                <AnimatedView
                  layout={Layout.springify()}
                  style={styles.activeTabBg}
                />
              )}
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText,
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </AnimatedView>

        <AnimatedView entering={FadeInUp.duration(500).delay(300)}>
          {activeTab === "expenses" ? (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Recent Expenses</Text>
                <Text style={styles.sectionCount}>{expenses.length} total</Text>
              </View>
              {expenses.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconCircle}>
                    <Ionicons
                      name="receipt-outline"
                      size={40}
                      color={COLORS.primary}
                    />
                  </View>
                  <Text style={styles.emptyTitle}>No expenses yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Tap the + button to add one
                  </Text>
                </View>
              ) : (
                <View style={styles.listContainer}>
                  {expenses?.map((expense, index) => (
                    <AnimatedView
                      key={expense._id}
                      entering={FadeInDown.duration(300).delay(index * 50)}
                      layout={Layout.springify()}
                    >
                      <ExpenseCard
                        expense={expense}
                        onPress={() => {
                          Haptics.impactAsync(
                            Haptics.ImpactFeedbackStyle.Light,
                          );
                          navigation.navigate("ExpenseDetail", {
                            expense: expense,
                            groupId: groupId,
                          });
                        }}
                      />
                    </AnimatedView>
                  ))}
                </View>
              )}
            </View>
          ) : activeTab === "balances" ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Current Balances</Text>
              {balances.flatMap((user) =>
                (user.owesTo || []).map((debt) => ({
                  from: user.name,
                  to:
                    balances.find((b) => b.userId === debt.paidBy || b.userId === debt.to)?.name ||
                    "Unknown",
                  amount: debt.amount,
                })),
              ).length === 0 ? (
                <View style={styles.emptyContainer}>
                  <View
                    style={[
                      styles.emptyIconCircle,
                      { backgroundColor: COLORS.success + "20" },
                    ]}
                  >
                    <Ionicons
                      name="checkmark-done-circle-outline"
                      size={48}
                      color={COLORS.success}
                    />
                  </View>
                  <Text style={styles.emptyTitle}>All settled up!</Text>
                  <Text style={styles.emptySubtitle}>
                    No one owes anything in this group
                  </Text>
                </View>
              ) : (
                <View style={styles.balancesList}>
                  {balances.flatMap((user) =>
                    (user.owesTo || []).map((debt, index) => {
                      const toUser = balances.find(
                        (b) =>
                          b.userId === (debt.paidBy || debt.userId || debt.to) ||
                          b.email === debt.email,
                      );

                      return (
                        <AnimatedView
                          entering={FadeInDown.duration(300).delay(index * 50)}
                          layout={Layout.springify()}
                          key={`${user.userId}-${index}`}
                          style={styles.balanceCard}
                        >
                          <View style={styles.balanceInfo}>
                            <View style={styles.balanceRow}>
                              <Text style={styles.balanceName}>
                                {user.name}
                              </Text>
                              <MaterialIcons
                                name="arrow-right-alt"
                                size={20}
                                color={COLORS.gray}
                                style={styles.balanceArrow}
                              />
                              <Text style={styles.balanceName}>
                                {toUser?.name || "Member"}
                              </Text>
                            </View>
                            <Text style={styles.balanceAmount}>
                              ₹{debt.amount.toFixed(2)}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={styles.settleButton}
                            activeOpacity={0.8}
                            onPress={() =>
                              openSettleModal({
                                fromUser: user,
                                toUser: toUser,
                                amount: debt.amount,
                              })
                            }
                          >
                            <Text style={styles.settleButtonText}>
                              Settle Up
                            </Text>
                          </TouchableOpacity>
                        </AnimatedView>
                      );
                    }),
                  )}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment History</Text>
              {payments.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconCircle}>
                    <Ionicons
                      name="time-outline"
                      size={40}
                      color={COLORS.gray}
                    />
                  </View>
                  <Text style={styles.emptyTitle}>No payments yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Settlements will appear here
                  </Text>
                </View>
              ) : (
                <View style={styles.balancesList}>
                  {payments.map((payment, index) => (
                    <AnimatedView
                      entering={FadeInDown.duration(300).delay(index * 50)}
                      layout={Layout.springify()}
                      key={index}
                      style={styles.historyCard}
                    >
                      <View style={styles.historyIconWrapper}>
                        <Ionicons
                          name="swap-horizontal"
                          size={20}
                          color={COLORS.success}
                        />
                      </View>
                      <View style={styles.balanceInfo}>
                        <Text style={styles.historyText}>
                          <Text style={styles.historyName}>
                            {payment.paidBy?.name || "Member"}
                          </Text>
                          <Text style={styles.historyAction}> paid </Text>
                          <Text style={styles.historyName}>
                            {payment.paidTo?.name || "Member"}
                          </Text>
                        </Text>
                        <Text style={styles.paymentDate}>
                          {new Date(payment.createdAt).toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric", year: "numeric" },
                          )}
                        </Text>
                      </View>
                      <Text style={styles.historyAmount}>
                        ₹{payment.amount.toFixed(2)}
                      </Text>
                    </AnimatedView>
                  ))}
                </View>
              )}
            </View>
          )}
        </AnimatedView>
        <View style={{ height: 100 }} />
      </ScrollView>

      <AnimatedView
        entering={ZoomIn.duration(400).delay(500)}
        style={[styles.floatingButtonContainer, { bottom: insets.bottom+35  }]}
      >
        <TouchableOpacity
          style={styles.floatingButton}
          activeOpacity={0.8}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            navigation.navigate("AddExpense", {
              groupId: groupId,
              members: group?.members || [],
            });
          }}
        >
          <LinearGradient
            colors={[COLORS.gradientStart, COLORS.gradientEnd]}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="add" size={24} color={COLORS.white} />
            <Text style={styles.fabLabel}>Add Expense</Text>
          </LinearGradient>
        </TouchableOpacity>
      </AnimatedView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={settleModalVisible}
        onRequestClose={() => setSettleModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setSettleModalVisible(false)}
          />
          <AnimatedView
            entering={FadeInUp.duration(300)}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Payment</Text>
              <TouchableOpacity onPress={() => setSettleModalVisible(false)}>
                <Ionicons
                  name="close-circle-outline"
                  size={28}
                  color={COLORS.gray}
                />
              </TouchableOpacity>
            </View>
 
            {settleData && (
              <View style={styles.modalUsersRow}>
                <View style={styles.modalUserAvatar}>
                  <Text style={styles.modalUserAvatarText}>
                    {settleData.fromUser.name.substring(0, 2).toUpperCase()}
                  </Text>
                </View>
                <MaterialIcons
                  name="arrow-forward"
                  size={24}
                  color={COLORS.primary}
                  style={{ marginHorizontal: 12 }}
                />
                <View style={styles.modalUserAvatar}>
                  <Text style={styles.modalUserAvatarText}>
                    {settleData.toUser?.name.substring(0, 2).toUpperCase()}
                  </Text>
                </View>
              </View>
            )}

            <Text style={styles.inputLabel}>Amount Settled</Text>
            <View style={styles.modalInputGroup}>
              <Text style={styles.modalCurrency}>₹</Text>
              <TextInput
                style={styles.modalInput}
                value={customSettleAmount}
                onChangeText={setCustomSettleAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={COLORS.gray}
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[styles.modalBtnConfirm, settling && { opacity: 0.7 }]}
              onPress={handleSettleUp}
              disabled={settling}
            >
              {settling ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.modalBtnTextConfirm}>
                  Confirm Settlement
                </Text>
              )}
            </TouchableOpacity>
          </AnimatedView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  containerWrapper: {
    flex: 1,
    backgroundColor: "#F4F5FA",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F4F5FA",
    gap: 12,
  },
  loadingText: { fontSize: 14, color: COLORS.gray, fontWeight: "600" },
  section: {
    marginBottom: 30,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.dark,
  },
  sectionCount: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
  },
  listContainer: {
    gap: 16,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.gray,
  },
  floatingButtonContainer: {
    position: "absolute",
    right: 24,
    zIndex: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  floatingButton: {
    height: 54,
    borderRadius: 27,
    overflow: "hidden",
    // Explicitly no shadow
    shadowColor: "transparent",
    elevation: 0,
  },
  fabGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    gap: 8,
  },
  fabLabel: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 24,
    backgroundColor: "#EBEBF5",
    borderRadius: 14,
    padding: 4,
    marginTop: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    zIndex: 1,
  },
  activeTabBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.primary,
    borderRadius: 11,
    zIndex: -1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gray,
  },
  activeTabText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  balancesList: {
    gap: 16,
    marginTop: 16,
  },
  balanceCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  balanceInfo: {
    flex: 1,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  balanceArrow: {
    marginHorizontal: 8,
  },
  balanceName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.dark,
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.danger,
  },
  settleButton: {
    backgroundColor: COLORS.primary + "18",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary + "35",
  },
  settleButtonText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "bold",
  },
  historyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  historyIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.success + "15",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  historyText: {
    fontSize: 15,
    color: COLORS.dark,
  },
  historyName: {
    fontWeight: "600",
  },
  historyAction: {
    color: COLORS.gray,
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.success,
  },
  paymentDate: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.dark,
  },
  modalUsersRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    backgroundColor: "#F8F9FA",
    padding: 16,
    borderRadius: 12,
  },
  modalUserAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + "22",
    alignItems: "center",
    justifyContent: "center",
  },
  modalUserAvatarText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.gray,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  modalInputGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  modalCurrency: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.dark,
    marginRight: 8,
  },
  modalInput: {
    flex: 1,
    height: 60,
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.dark,
  },
  modalBtnConfirm: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnTextConfirm: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
  },
});
