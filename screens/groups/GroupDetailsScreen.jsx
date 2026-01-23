import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import ExpenseCard from "../../components/ExpenseCard";
import GroupSummaryCard from "../../components/GroupSummaryCard";
import { groupService } from "../../services/authService";
import { COLORS } from "../../utils/constants";

export default function GroupDetailScreen({ route, navigation }) {
  const { groupId } = route.params;
  const [group, setGroup] = useState();
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [activeTab, setActiveTab] = useState("expenses");
  const [inviteLink, setInviteLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [settleModalVisible, setSettleModalVisible] = useState(false);
  const [settleData, setSettleData] = useState(null);
  const [customSettleAmount, setCustomSettleAmount] = useState("");
  const [settling, setSettling] = useState(false);

  const openSettleModal = (data) => {
    setSettleData(data);
    setCustomSettleAmount(data.amount.toString());
    setSettleModalVisible(true);
  };

  const handleSettleUp = async () => {
    if (!customSettleAmount || isNaN(customSettleAmount)) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    setSettling(true);
    try {
      // NOTE: Using addExpense to record "payment/settlement".
      // Assuming 'splitBetween' target is the person receiving money.
      await groupService.addExpense(
        groupId,
        parseFloat(customSettleAmount),
        [settleData.toUser.userId], // Split with the person being paid
        `Settlement to ${settleData.toUser?.name || "Member"}`,
      );

      setSettleModalVisible(false);
      Alert.alert("Success", "Payment recorded successfully!");
      // Refresh data
      fetchExpenses();
      fetchBalances();
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to record settlement");
    } finally {
      setSettling(false);
    }
  };

  const fetchGroupDetails = async () => {
    try {
      const response = await groupService.getGroup(groupId);
      // console.log(response, "red");

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
      // console.log(response.data.balances,'fssf');

      // setBalances(response.data.balances || []);
    } catch (error) {
      console.log("Failed to fetch balances:", error);
    }
  };
  useFocusEffect(
    useCallback(() => {
      fetchGroupDetails();
      fetchExpenses();
      fetchBalances();
    }, [groupId]),
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: group?.name || "Group Details",
    });
  }, [navigation, group?.name]);
  const shareInviteLink = async () => {
    try {
      await Share.share({
        message: `Join my group "${group.name}" on ExpenseSplitter!\n\n${inviteLink}`,
        title: `Join ${group.name}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const copyInviteLink = () => {
    Alert.alert("Copied!", "Invite link copied to clipboard");
  };

  const regenerateInviteCode = async () => {
    Alert.alert(
      "Regenerate Invite Link",
      "This will invalidate the old invite link. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Regenerate",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await groupService.regenerateInviteCode(groupId);
              setInviteLink(response.inviteLink);
              Alert.alert("Success", "New invite link generated");
            } catch (error) {
              Alert.alert("Error", "Failed to regenerate invite link");
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.containerWrapper}>
      <ScrollView style={styles.container}>
        <GroupSummaryCard
          group={group}
          totalExpenses={expenses.reduce(
            (sum, expense) => sum + (expense.amount || 0),
            0,
          )}
          onAddMember={() =>
            navigation.navigate("AddMember", {
              groupId: groupId,
              currentMembers: group?.members || [],
            })
          }
          onPress={() =>
            navigation.navigate("GroupMembers", {
              groupId: groupId,
              group: group,
              expenses: expenses,
            })
          }
        />

        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invite Link</Text>
          <View style={styles.inviteContainer}>
            <Text style={styles.inviteLink} numberOfLines={1}>
              {inviteLink}
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={copyInviteLink}
            >
              <Text style={styles.buttonSecondaryText}>Copy Link</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={shareInviteLink}
            >
              <Text style={styles.buttonText}>Share Link</Text>
            </TouchableOpacity>
          </View>

          {group?.createdBy?._id === group?.members[0]?._id && (
            <TouchableOpacity
              style={[styles.button, styles.buttonDanger]}
              onPress={regenerateInviteCode}
            >
              <Text style={styles.buttonText}>Regenerate Invite Link</Text>
            </TouchableOpacity>
          )}
        </View> */}

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "expenses" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("expenses")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "expenses" && styles.activeTabText,
              ]}
            >
              Expenses
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "balances" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("balances")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "balances" && styles.activeTabText,
              ]}
            >
              Balances
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === "expenses" ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Expenses</Text>
            {expenses.length === 0 ? (
              <View style={styles.emptyExpenses}>
                <Icon name="receipt" size={40} color={COLORS.gray} />
                <Text style={styles.emptyExpensesText}>No expenses yet</Text>
              </View>
            ) : (
              expenses?.map((expense) => (
                <ExpenseCard
                  key={expense._id}
                  expense={expense}
                  onPress={() =>
                    navigation.navigate("ExpenseDetail", {
                      expense: expense,
                      groupId: groupId,
                    })
                  }
                />
              ))
            )}
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Balances</Text>
            {balances.flatMap((user) =>
              (user.owesTo || []).map((debt) => ({
                from: user.name,
                to:
                  balances.find((b) => b.userId === debt.paidBy)?.name ||
                  "Unknown",
                amount: debt.amount,
              })),
            ).length === 0 ? (
              <View style={styles.emptyExpenses}>
                <Icon name="check-circle" size={40} color={COLORS.success} />
                <Text style={styles.emptyExpensesText}>All settled up!</Text>
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
                      <View
                        key={`${user.userId}-${index}`}
                        style={styles.balanceCard}
                      >
                        <View style={styles.balanceInfo}>
                          <Text style={styles.balanceText}>
                            <Text style={styles.balanceName}>{user.name}</Text>
                            <Text style={styles.balanceAction}> will pay </Text>
                            <Text style={styles.balanceName}>
                              {toUser?.name || "Member"}
                            </Text>
                          </Text>
                          <Text style={styles.balanceAmount}>
                            ₹{debt.amount.toFixed(2)}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.settleButton}
                          onPress={() =>
                            openSettleModal({
                              fromUser: user,
                              toUser: toUser,
                              amount: debt.amount,
                            })
                          }
                        >
                          <Text style={styles.settleButtonText}>Settle Up</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  }),
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() =>
          navigation.navigate("AddExpense", {
            groupId: groupId,
            members: group?.members || [],
          })
        }
      >
        <Icon name="add" size={28} color={COLORS.white} />
        {/* <Text style={styles.floatingButtonText}>Expense</Text> */}
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={settleModalVisible}
        onRequestClose={() => setSettleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Record Payment</Text>

            {settleData && (
              <Text style={styles.modalSubtitle}>
                {settleData.fromUser.name} pays {settleData.toUser?.name}
              </Text>
            )}

            <Text style={styles.inputLabel}>Amount to Settle</Text>
            <TextInput
              style={styles.modalInput}
              value={customSettleAmount}
              onChangeText={setCustomSettleAmount}
              keyboardType="numeric"
              placeholder="Enter amount"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setSettleModalVisible(false)}
              >
                <Text style={styles.modalBtnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnConfirm]}
                onPress={handleSettleUp}
                disabled={settling}
              >
                {settling ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalBtnTextConfirm}>Settle</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  containerWrapper: {
    flex: 1,
    position: "relative",
    backgroundColor: COLORS.white,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 0,
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 8,
  },
  addExpenseButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addExpenseButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "bold",
  },
  addMemberButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addMemberButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "bold",
  },
  settleButton: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 6,
  },
  settleButtonText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "bold",
  },
  groupName: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  memberItem: {
    padding: 15,
    backgroundColor: COLORS.light,
    borderRadius: 8,
    marginBottom: 10,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.dark,
  },
  memberEmail: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 5,
  },
  inviteContainer: {
    padding: 15,
    backgroundColor: COLORS.light,
    borderRadius: 8,
    marginBottom: 15,
  },
  inviteLink: {
    fontSize: 14,
    color: COLORS.dark,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonPrimary: {
    backgroundColor: COLORS.primary,
  },
  buttonSecondary: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  buttonDanger: {
    backgroundColor: "#ff4444",
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonSecondaryText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyExpenses: {
    alignItems: "center",
    paddingVertical: 30,
  },
  emptyExpensesText: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 10,
  },
  floatingButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: COLORS.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    paddingBottom: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  floatingButtonText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "bold",
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 20,
    backgroundColor: COLORS.light,
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: COLORS.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gray,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  balancesList: {
    gap: 12,
  },
  balanceCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.light,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceText: {
    fontSize: 15,
    color: COLORS.dark,
  },
  balanceName: {
    fontWeight: "bold",
  },
  balanceAction: {
    color: COLORS.gray,
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  modalOverlay: {
    flex: 1,
    // backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 5,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 20,
    textAlign: "center",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.dark,
    marginBottom: 5,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.light,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: COLORS.light,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 15,
  },
  modalBtn: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  modalBtnCancel: {
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  modalBtnConfirm: {
    backgroundColor: COLORS.primary,
  },
  modalBtnTextCancel: {
    color: COLORS.dark,
    fontWeight: "bold",
  },
  modalBtnTextConfirm: {
    color: COLORS.white,
    fontWeight: "bold",
  },
});
