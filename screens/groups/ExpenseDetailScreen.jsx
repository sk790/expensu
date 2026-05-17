import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import React from "react";
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, {
    FadeInDown,
    FadeInUp,
    ZoomIn,
} from "react-native-reanimated";
import AnimatedView from "../../components/AnimatedView";
import CustomAlert from "../../components/CustomAlert";
import { useAlert } from "../../hooks/useAlert";
import { groupService } from "../../services/authService";
import { COLORS } from "../../utils/constants";
import { useAuth } from "../../context/AuthContext";

export default function ExpenseDetailScreen({ route, navigation }) {
  const { expense: initialExpense, groupId, fromHistory } = route.params;
  const [expense, setExpense] = React.useState(initialExpense);
  const [loading, setLoading] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const { alertProps, showAlert } = useAlert();
  const { user: currentUser } = useAuth();

  const currentUserId = currentUser?._id || currentUser?.id;
  const isCreator = currentUserId === (expense.paidBy?._id || expense.paidBy);

  useFocusEffect(
    React.useCallback(() => {
      const refreshExpense = async () => {
        try {
          setRefreshing(true);
          const response = await groupService.getGroupExpenses(groupId);
          const updatedExpense = response.data.find(
            (exp) => exp._id === initialExpense._id,
          );
          if (updatedExpense) setExpense(updatedExpense);
        } catch (error) {
          console.log("Failed to refresh expense:", error);
        } finally {
          setRefreshing(false);
        }
      };
      refreshExpense();
    }, [groupId, initialExpense._id]),
  );

  const splitAmount = expense.amount / expense.splitBetween.length;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showAlert({
      type: "confirm",
      title: "Delete Expense",
      message: "Are you sure you want to delete this expense?",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await groupService.deleteExpense(groupId, expense._id);
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
              if (fromHistory) {
                navigation.navigate("History");
              } else {
                navigation.goBack();
              }
            } catch (error) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              showAlert({
                type: "error",
                title: "Error",
                message: "Failed to delete expense",
              });
            }
          },
        },
      ],
    });
  };

  const handleEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("AddExpense", {
      groupId,
      members: expense.splitBetween,
      isEditing: true,
      expenseData: {
        id: expense._id,
        description: expense.description,
        amount: expense.amount,
        splitBetween: expense.splitBetween.map((m) => m._id),
        paidBy: expense.paidBy._id,
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomAlert {...alertProps} />
      {refreshing && (
        <View style={styles.refreshBar}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.refreshText}>Refreshing...</Text>
        </View>
      )}
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Amount Card */}
        <AnimatedView
          entering={FadeInDown.duration(400).delay(100)}
          style={styles.amountCard}
        >
          <View style={styles.amountIconRow}>
            <MaterialIcons
              name="receipt-long"
              size={28}
              color={COLORS.primary}
            />
          </View>
          <Text style={styles.descriptionText}>{expense.description}</Text>
          <Text style={styles.amountText}>₹{expense.amount.toFixed(2)}</Text>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.gray} />
            <Text style={styles.dateText}>{formatDate(expense.createdAt)}</Text>
          </View>
          <View style={styles.perPersonBadge}>
            <Text style={styles.perPersonText}>
              ₹{splitAmount.toFixed(2)} per person
            </Text>
          </View>
        </AnimatedView>

        {/* Paid By */}
        <AnimatedView
          entering={FadeInDown.duration(400).delay(200)}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="card-outline" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Paid By</Text>
          </View>
          <View style={styles.paidByCard}>
            <View style={styles.paidByAvatar}>
              <Text style={styles.paidByAvatarText}>
                {expense.paidBy.name.substring(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={styles.paidByInfo}>
              <Text style={styles.paidByName}>{expense.paidBy.name}</Text>
              <Text style={styles.paidByEmail}>{expense.paidBy.email}</Text>
            </View>
            <Text style={styles.paidByAmount}>
              ₹{expense.amount.toFixed(2)}
            </Text>
          </View>
        </AnimatedView>

        {/* Split Among */}
        <AnimatedView
          entering={FadeInDown.duration(400).delay(300)}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="people-outline" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Split Among</Text>
            <Text style={styles.memberCount}>
              {expense.splitBetween.length} people
            </Text>
          </View>
          <View style={styles.membersCard}>
            {expense.splitBetween.map((member, index) => (
              <AnimatedView
                key={member._id || index}
                entering={ZoomIn.duration(300).delay(100 + index * 50)}
                style={[
                  styles.memberSplitCard,
                  index !== expense.splitBetween.length - 1 &&
                    styles.memberBorder,
                ]}
              >
                <View style={styles.memberSplitLeft}>
                  <View
                    style={[
                      styles.memberAvatar,
                      expense.paidBy._id === member._id &&
                        styles.memberAvatarPayer,
                    ]}
                  >
                    <Text
                      style={[
                        styles.avatarText,
                        expense.paidBy._id === member._id &&
                          styles.avatarTextPayer,
                      ]}
                    >
                      {member.name.substring(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.memberSplitInfo}>
                    <Text style={styles.memberSplitName}>{member.name}</Text>
                    <Text style={styles.memberSplitEmail}>{member.email}</Text>
                  </View>
                </View>
                <View style={styles.memberSplitRight}>
                  <Text style={styles.memberSplitAmount}>
                    ₹{splitAmount.toFixed(2)}
                  </Text>
                  {expense.paidBy._id === member._id && (
                    <View style={styles.paidBadge}>
                      <Text style={styles.paidBadgeText}>Paid</Text>
                    </View>
                  )}
                </View>
              </AnimatedView>
            ))}
          </View>
        </AnimatedView>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Action Buttons */}
      {isCreator && (
        <AnimatedView
          entering={FadeInUp.duration(400).delay(400)}
          style={styles.actionContainer}
        >
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={handleEdit}
            activeOpacity={0.8}
          >
            <Ionicons name="pencil" size={18} color={COLORS.white} />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.white} />
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </AnimatedView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },
  refreshBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
    backgroundColor: COLORS.primary + "10",
  },
  refreshText: { fontSize: 13, color: COLORS.primary, fontWeight: "500" },
  amountCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    borderTopWidth: 4,
    borderTopColor: COLORS.primary,
  },
  amountIconRow: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.dark,
    marginBottom: 8,
    textAlign: "center",
  },
  amountText: {
    fontSize: 44,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  dateText: { fontSize: 13, color: COLORS.gray },
  perPersonBadge: {
    backgroundColor: COLORS.primary + "15",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  perPersonText: { fontSize: 14, color: COLORS.primary, fontWeight: "600" },
  section: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.dark,
    flex: 1,
  },
  memberCount: { fontSize: 13, color: COLORS.primary, fontWeight: "600" },
  paidByCard: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  paidByAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + "20",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  paidByAvatarText: { fontSize: 16, fontWeight: "bold", color: COLORS.primary },
  paidByInfo: { flex: 1 },
  paidByName: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 2,
  },
  paidByEmail: { fontSize: 13, color: COLORS.gray },
  paidByAmount: { fontSize: 20, fontWeight: "bold", color: COLORS.primary },
  membersCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  memberSplitCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    justifyContent: "space-between",
  },
  memberBorder: { borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  memberSplitLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  memberAvatarPayer: { backgroundColor: COLORS.primary + "20" },
  avatarText: { fontSize: 14, fontWeight: "bold", color: COLORS.gray },
  avatarTextPayer: { color: COLORS.primary },
  memberSplitInfo: { flex: 1 },
  memberSplitName: { fontSize: 15, fontWeight: "600", color: COLORS.dark },
  memberSplitEmail: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  memberSplitRight: { alignItems: "flex-end" },
  memberSplitAmount: { fontSize: 15, fontWeight: "bold", color: COLORS.dark },
  paidBadge: {
    backgroundColor: COLORS.success + "20",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  paidBadgeText: { color: COLORS.success, fontSize: 11, fontWeight: "bold" },
  actionContainer: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    backgroundColor: COLORS.white,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  editButton: { backgroundColor: COLORS.secondary },
  deleteButton: { backgroundColor: COLORS.danger },
  actionButtonText: { color: COLORS.white, fontSize: 15, fontWeight: "bold" },
});
