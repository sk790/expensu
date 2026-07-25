import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useLayoutEffect, useState } from "react";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  RefreshControl,
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
import { useAuth } from "../../context/AuthContext";
import { useAlert } from "../../hooks/useAlert";
import CustomAlert from "../../components/CustomAlert";

const CURRENCY_SYMBOLS = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CAD: "C$",
  AUD: "A$",
};

export default function GroupDetailScreen({ route, navigation }) {
  const { groupId } = route.params;
  const { user: currentUser } = useAuth();
  const [group, setGroup] = useState();
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [payments, setPayments] = useState([]);
  const [activeTab, setActiveTab] = useState("expenses");
  const [inviteLink, setInviteLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [settleModalVisible, setSettleModalVisible] = useState(false);
  const [settleData, setSettleData] = useState(null);
  const [customSettleAmount, setCustomSettleAmount] = useState("");
  const [settling, setSettling] = useState(false);
  const insets = useSafeAreaInsets();
  const [exporting, setExporting] = useState(false);
  const { alertProps, showAlert } = useAlert();
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [reminderData, setReminderData] = useState(null);

  const currencySymbol = CURRENCY_SYMBOLS[group?.currency] || "₹";

  const handleExportPDF = async () => {
    if (expenses.length === 0) {
      showAlert({
        type: "info",
        title: "No Expenses",
        message: "There are no expenses in this group to export.",
      });
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setExporting(true);

    try {
      const totalAmount = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

      const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
      };

      const memberNames = group?.members?.map((m) => m.name).join(", ") || "None";

      // Calculate total rupees spent by each member in the group
      const getUserId = (u) => u?._id || u?.id || (typeof u === "string" ? u : "");
      const memberSpending = (group?.members || []).map((m) => {
        const mId = getUserId(m);
        const amt = expenses
          .filter((exp) => getUserId(exp.paidBy) === mId)
          .reduce((sum, exp) => sum + (exp.amount || 0), 0);
        return { name: m.name, amount: amt };
      });

      // Sort members by total spending (descending order)
      memberSpending.sort((a, b) => b.amount - a.amount);

      const memberSpendingHtml = memberSpending
        .map(
          (m) => `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 13px;">
          <span style="color: #4B5563; font-weight: 500;">${m.name}</span>
          <span style="font-weight: 700; color: #111827;">${currencySymbol}${m.amount.toFixed(2)}</span>
        </div>
      `,
        )
        .join("");

      const expenseRowsHtml = expenses
        .map(
          (exp) => `
        <tr>
          <td>${formatDate(exp.createdAt)}</td>
          <td>${exp.description}</td>
          <td>${exp.paidBy?.name || "Member"}</td>
          <td style="font-weight: bold; color: #111827;">${currencySymbol}${exp.amount.toFixed(2)}</td>
        </tr>
      `,
        )
        .join("");

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Expense Report - ${group?.name || "Group"}</title>
            <style>
              body {
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                color: #111827;
                margin: 40px;
                line-height: 1.6;
              }
              .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 2px solid #6C63FF;
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              .title-area h1 {
                margin: 0 0 6px 0;
                font-size: 26px;
                color: #6C63FF;
                font-weight: 800;
              }
              .title-area p {
                margin: 0;
                color: #6B7280;
                font-size: 13px;
              }
              .total-spent {
                text-align: right;
              }
              .total-spent h2 {
                margin: 0;
                font-size: 28px;
                color: #10B981;
                font-weight: 800;
              }
              .total-spent p {
                margin: 0;
                color: #6B7280;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.8px;
              }
              .summary-section {
                background: #F9FAFB;
                border-radius: 16px;
                padding: 20px;
                margin-bottom: 30px;
                border: 1px solid #E5E7EB;
              }
              .summary-section h3 {
                margin: 0 0 8px 0;
                font-size: 14px;
                color: #374151;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .summary-section p {
                margin: 0;
                color: #4B5563;
                font-size: 13px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 40px;
              }
              th {
                background-color: #6C63FF;
                color: #ffffff;
                text-align: left;
                padding: 14px 16px;
                font-size: 12px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.8px;
              }
              td {
                padding: 14px 16px;
                border-bottom: 1px solid #E5E7EB;
                font-size: 13px;
                color: #374151;
              }
              tr:nth-child(even) {
                background-color: #F9FAFB;
              }
              .footer {
                text-align: center;
                margin-top: 60px;
                font-size: 11px;
                color: #9CA3AF;
                border-top: 1px solid #E5E7EB;
                padding-top: 20px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title-area">
                <h1>${group?.name || "Group"}</h1>
                <p>Expense Report &bull; Generated on ${new Date().toLocaleDateString("en-IN")}</p>
              </div>
              <div class="total-spent">
                <h2>${currencySymbol}${totalAmount.toFixed(2)}</h2>
                <p>Total Spent</p>
              </div>
            </div>

            <div style="display: flex; gap: 20px; margin-bottom: 30px; align-items: stretch;">
              <div class="summary-section" style="flex: 1; margin-bottom: 0;">
                <h3>Group Details</h3>
                <p style="margin-bottom: 8px;"><strong>Group Name:</strong> ${group?.name || "Group"}</p>
                <p style="margin-bottom: 8px;"><strong>Total Expenses:</strong> ${expenses.length}</p>
                <p style="margin-bottom: 0;"><strong>Group Members:</strong> ${memberNames}</p>
              </div>
              <div class="summary-section" style="flex: 1; margin-bottom: 0;">
                <h3>Total Spending by Member</h3>
                <div style="margin-top: 10px;">
                  ${memberSpendingHtml}
                </div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Paid By</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${expenseRowsHtml}
              </tbody>
            </table>

            <div class="footer">
              <p>Generated with SplitMate &bull; Share Expenses, Stay Friends</p>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: `Export ${group?.name || "Group"} Expenses`,
        UTI: "com.adobe.pdf",
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("PDF generation failed:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert({
        type: "error",
        title: "Export Failed",
        message: "Failed to generate or share PDF expense report.",
      });
    } finally {
      setExporting(false);
    }
  };

  const openSettleModal = (data) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSettleData(data);
    setCustomSettleAmount(data.amount.toString());
    setSettleModalVisible(true);
  };

  const handleSettleUp = async () => {
    if (!customSettleAmount || isNaN(customSettleAmount)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert({
        type: "error",
        title: "Error",
        message: "Please enter a valid amount",
      });
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSettling(true);
    try {
      await groupService.settleUp(
        groupId,
        settleData.fromUser.userId,
        settleData.toUser.userId,
        parseFloat(customSettleAmount),
      );

      setSettleModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert({
        type: "success",
        title: "Success",
        message: "Payment recorded successfully!",
      });
      fetchExpenses();
      fetchBalances();
      fetchPayments();
    } catch (error) {
      console.log(error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert({
        type: "error",
        title: "Error",
        message: "Failed to record settlement",
      });
    } finally {
      setSettling(false);
    }
  };

  const handleSendReminder = (debtorUser, amount) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const groupName = group?.name || "our group";
    const debtorName = debtorUser?.name || "there";
    const myName = currentUser?.name || "your friend";
    const symbol = currencySymbol;

    const message =
      `Hey ${debtorName}! 😊\n\n` +
      `Just a gentle reminder — you have a pending balance of *${symbol}${amount.toFixed(2)}* ` +
      `in our *"${groupName}"* group on SplitMate.\n\n` +
      `No rush at all, just keeping things organised! 🙏\n\n` +
      `— ${myName}`;

    setReminderData({ message, debtorName });
    setReminderModalVisible(true);
  };

  const fetchGroupDetails = async () => {
    try {
      const response = await groupService.getGroup(groupId);
      setGroup(response.data);
      setInviteLink(response.inviteLink);
    } catch (error) {
      showAlert({
        type: "error",
        title: "Error",
        message: "Failed to load group details",
      });
      navigation.goBack();
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

  const loadData = async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) {
      setLoading(true);
    }
    try {
      await Promise.all([
        fetchGroupDetails(),
        fetchExpenses(),
        fetchBalances(),
        fetchPayments(),
      ]);
    } catch (error) {
      console.log("Error loading group data:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await loadData(false);
    } catch (error) {
      console.log("Failed to refresh group details:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const shouldShowSpinner = !group;
      loadData(shouldShowSpinner);
    }, [groupId, group]),
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

  if (loading && !refreshing) {
    return <LoadingSpinner message="Loading group details..." />;
  }

  const currentUserId = currentUser?._id || currentUser?.id;
  const isAdmin = group && currentUser && (group.createdBy?._id || group.createdBy?.id || group.createdBy) === currentUserId;

  return (
    <View style={styles.containerWrapper}>
      {/* Fixed Group Summary Card at the top */}
      <AnimatedView
        entering={FadeInDown.duration(400).delay(100)}
        style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 }}
      >
        <GroupSummaryCard
          group={group}
          totalExpenses={expenses.reduce(
            (sum, expense) => sum + (expense.amount || 0),
            0,
          )}
          isAdmin={isAdmin}
          onAddMember={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate("AddMember", {
              groupId: groupId,
              currentMembers: group?.members || [],
              isAdmin: isAdmin,
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

      {/* Scrollable Tab Content & Details with RefreshControl appearing directly below the Summary Card */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.container}
        contentContainerStyle={[styles.scrollContent, { paddingTop: 8 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
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
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={styles.sectionTitle}>Recent Expenses</Text>
                  {expenses.length > 0 && (
                    <View style={styles.inlineCountBadge}>
                      <Text style={styles.inlineCountBadgeText}>{expenses.length}</Text>
                    </View>
                  )}
                </View>
                {expenses.length > 0 && (
                  <TouchableOpacity
                    onPress={handleExportPDF}
                    disabled={exporting}
                    style={styles.inlineExportBtn}
                    activeOpacity={0.7}
                  >
                    {exporting ? (
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                      <>
                        <Ionicons
                          name="document-text-outline"
                          size={15}
                          color={COLORS.primary}
                          style={{ marginRight: 4 }}
                        />
                        <Text style={styles.inlineExportBtnText}>Export PDF</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
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
                        currency={group?.currency}
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
                      const currentUserId = currentUser?._id || currentUser?.id;
                      const isCurrentUserCreditor =
                        toUser?.userId === currentUserId ||
                        (toUser?.email && currentUser?.email && toUser.email.toLowerCase() === currentUser.email.toLowerCase());
                      const isCurrentUserDebtor =
                        user.userId === currentUserId ||
                        (user.email && currentUser?.email && user.email.toLowerCase() === currentUser.email.toLowerCase());

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
                              {currencySymbol}{debt.amount.toFixed(2)}
                            </Text>
                          </View>
                          {isCurrentUserCreditor ? (
                            <View style={styles.creditorButtons}>
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
                                <Ionicons name="checkmark-done-outline" size={13} color={COLORS.primary} />
                                <Text style={styles.settleButtonText}>Settle Up</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.remindBtn}
                                activeOpacity={0.8}
                                onPress={() => handleSendReminder(user, debt.amount)}
                              >
                                <Ionicons name="notifications-outline" size={13} color="#FF9500" />
                                <Text style={styles.remindBtnText}>Remind</Text>
                              </TouchableOpacity>
                            </View>
                          ) : isCurrentUserDebtor ? (
                            <View style={styles.settleButtonDisabled}>
                              <Text style={styles.settleButtonDisabledText}>
                                Settle Up
                              </Text>
                            </View>
                          ) : null}
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
                        {currencySymbol}{payment.amount.toFixed(2)}
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
        style={[styles.floatingButtonContainer, { bottom: insets.bottom + 20 }]}
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
            <Ionicons name="add" size={18} color={COLORS.white} />
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
              <Text style={styles.modalCurrency}>{currencySymbol}</Text>
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

      {/* Reminder Modal */}
      <Modal
  visible={reminderModalVisible}
  transparent
  animationType="slide"
  onRequestClose={() => setReminderModalVisible(false)}
>
  <TouchableOpacity
    style={styles.modalOverlay}
    activeOpacity={1}
    onPress={() => setReminderModalVisible(false)}
  >
    <TouchableOpacity activeOpacity={1} onPress={() => {}}>
      <AnimatedView
        entering={FadeInUp.duration(300)}
        style={styles.reminderSheet}
      >
        <View style={styles.reminderSheetHandle} />

        <View style={styles.reminderHeader}>
          <View style={styles.reminderIconCircle}>
            <Ionicons name="notifications" size={24} color="#FF9500" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.reminderTitle}>Send Reminder</Text>
            <Text style={styles.reminderSubtitle}>To {reminderData?.debtorName}</Text>
          </View>
          <TouchableOpacity onPress={() => setReminderModalVisible(false)}>
            <Ionicons name="close-circle-outline" size={26} color={COLORS.gray} />
          </TouchableOpacity>
        </View>

        {/* Message Preview */}
        <View style={styles.msgPreviewBox}>
          <Text style={styles.msgPreviewLabel}>Message Preview</Text>
          <Text style={styles.msgPreviewText}>{reminderData?.message}</Text>
        </View>

        {/* Share Buttons */}
        <Text style={styles.shareViaLabel}>Share via</Text>
        <View style={styles.shareButtonsRow}>
          {/* WhatsApp */}
          <TouchableOpacity
            style={[styles.shareAppBtn, { backgroundColor: "#25D366" }]}
            activeOpacity={0.85}
            onPress={async () => {
              const encoded = encodeURIComponent(reminderData?.message || "");
              const url = `whatsapp://send?text=${encoded}`;
              const canOpen = await Linking.canOpenURL(url);
              if (canOpen) {
                Linking.openURL(url);
              } else {
                showAlert({ type: "error", title: "WhatsApp not found", message: "Please install WhatsApp to use this option." });
              }
              setReminderModalVisible(false);
            }}
          >
            <Ionicons name="logo-whatsapp" size={22} color="#FFF" />
            <Text style={styles.shareAppText}>WhatsApp</Text>
          </TouchableOpacity>

          {/* Telegram */}
          <TouchableOpacity
            style={[styles.shareAppBtn, { backgroundColor: "#2AABEE" }]}
            activeOpacity={0.85}
            onPress={async () => {
              const encoded = encodeURIComponent(reminderData?.message || "");
              const url = `tg://msg?text=${encoded}`;
              const canOpen = await Linking.canOpenURL(url);
              if (canOpen) {
                Linking.openURL(url);
              } else {
                showAlert({ type: "error", title: "Telegram not found", message: "Please install Telegram to use this option." });
              }
              setReminderModalVisible(false);
            }}
          >
            <Ionicons name="paper-plane-outline" size={22} color="#FFF" />
            <Text style={styles.shareAppText}>Telegram</Text>
          </TouchableOpacity>

          {/* Native Share */}
          <TouchableOpacity
            style={[styles.shareAppBtn, { backgroundColor: COLORS.primary }]}
            activeOpacity={0.85}
            onPress={async () => {
              await Share.share({ message: reminderData?.message || "" });
              setReminderModalVisible(false);
            }}
          >
            <Ionicons name="share-social-outline" size={22} color="#FFF" />
            <Text style={styles.shareAppText}>More</Text>
          </TouchableOpacity>
        </View>
      </AnimatedView>
    </TouchableOpacity>
  </TouchableOpacity>
</Modal>

      <CustomAlert {...alertProps} />
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
    gap: 8,
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
    right: 20,
    zIndex: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  floatingButton: {
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    // Explicitly no shadow
    shadowColor: "transparent",
    elevation: 0,
  },
  fabGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 6,
  },
  fabLabel: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 12,
    backgroundColor: "#EBEBF5",
    borderRadius: 14,
    padding: 4,
    marginTop: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
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
    gap: 8,
    marginTop: 10,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: COLORS.primary + "12",
    borderWidth: 1,
    borderColor: COLORS.primary + "35",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    alignSelf: "stretch",
  },
  settleButtonText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  settleButtonDisabled: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  settleButtonDisabledText: {
    color: "#9CA3AF",
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
  inlineExportBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary + "12",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary + "20",
  },
  inlineExportBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "750",
  },
  inlineCountBadge: {
    backgroundColor: COLORS.primary + "12",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  inlineCountBadgeText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "800",
  },

  // Creditor action buttons column
  creditorButtons: {
    flexDirection: "column",
    gap: 6,
    alignItems: "flex-end",
  },
  remindBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#FF950012",
    borderWidth: 1,
    borderColor: "#FF950035",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    alignSelf: "stretch",
  },
  remindBtnText: {
    color: "#FF9500",
    fontSize: 12,
    fontWeight: "700",
  },

  // Reminder Modal
  reminderSheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
    marginTop: "auto",
  },
  reminderSheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E2E8F0",
    alignSelf: "center",
    marginBottom: 20,
  },
  reminderHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  reminderIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FF950015",
    alignItems: "center",
    justifyContent: "center",
  },
  reminderTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A1A2E",
  },
  reminderSubtitle: {
    fontSize: 13,
    color: "#888",
    fontWeight: "500",
  },
  msgPreviewBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  msgPreviewLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  msgPreviewText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
  },
  shareViaLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  shareButtonsRow: {
    flexDirection: "row",
    gap: 10,
  },
  shareAppBtn: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 16,
  },
  shareAppText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
  },
});
