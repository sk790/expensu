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
  Image,
  Linking,
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

const CURRENCY_SYMBOLS = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CAD: "C$",
  AUD: "A$",
};

export default function ExpenseDetailScreen({ route, navigation }) {
  const { expense: initialExpense, groupId, fromHistory } = route.params;
  const [expense, setExpense] = React.useState(initialExpense);
  const [group, setGroup] = React.useState(null);
  const category = expense?.category;
  const accentColor = category?.color || COLORS.primary;
  const categoryIcon = category?.icon || "receipt-outline";
  const categoryName = category?.name || "Others";

  const [loading, setLoading] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const { alertProps, showAlert } = useAlert();
  const { user: currentUser } = useAuth();

  const currentUserId = currentUser?._id || currentUser?.id;
  const isCreator = currentUserId === (expense.paidBy?._id || expense.paidBy);
  const currencySymbol = CURRENCY_SYMBOLS[group?.currency] || "₹";



  useFocusEffect(
    React.useCallback(() => {
      const refreshData = async () => {
        try {
          setRefreshing(true);
          const [expenseResponse, groupResponse] = await Promise.all([
            groupService.getGroupExpenses(groupId),
            groupService.getGroup(groupId),
          ]);

          const updatedExpense = expenseResponse.data.find(
            (exp) => exp._id === initialExpense._id,
          );
          if (updatedExpense) setExpense(updatedExpense);
          if (groupResponse.data) setGroup(groupResponse.data);
        } catch (error) {
          console.log("Failed to refresh expense details:", error);
        } finally {
          setRefreshing(false);
        }
      };
      refreshData();
    }, [groupId, initialExpense._id]),
  );

  const getMemberSplitAmount = React.useCallback((memberId) => {
    if (expense.splits && expense.splits.length > 0) {
      const split = expense.splits.find(s => {
        const sId = s.user?._id || s.user;
        return sId && sId.toString() === memberId.toString();
      });
      if (split) return split.amount;
    }
    return expense.amount / (expense.splitBetween?.length || 1);
  }, [expense]);

  const splitAmount = getMemberSplitAmount(currentUserId);

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
        splits: expense.splits,
        paidBy: expense.paidBy._id,
        category: expense.category?._id || expense.category,
        attachment: expense.attachment,
        attachmentPublicId: expense.attachmentPublicId,
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
          style={[styles.amountCard, { borderTopColor: accentColor }]}
        >
          {/* Top Row: Category Icon, Description, Date & Category Tag */}
          <View style={styles.heroRow}>
            <View style={[styles.compactIconCircle, { backgroundColor: accentColor + "15" }]}>
              <Ionicons name={categoryIcon} size={22} color={accentColor} />
            </View>
            <View style={styles.heroTextContainer}>
              <Text style={styles.descriptionText} numberOfLines={1}>{expense.description}</Text>
              <View style={styles.heroMetaRow}>
                <Text style={styles.heroDateText}>{formatDate(expense.createdAt)}</Text>
                {categoryName && (
                  <>
                    <Text style={styles.bulletSeparator}>•</Text>
                    <View style={[styles.categoryMiniChipDetail, { backgroundColor: accentColor + "10" }]}>
                      <Text style={[styles.categoryMiniChipDetailText, { color: accentColor }]}>{categoryName}</Text>
                    </View>
                  </>
                )}
              </View>
            </View>
            {isCreator && (
              <View style={styles.cardActionsRow}>
                <TouchableOpacity
                  onPress={handleEdit}
                  activeOpacity={0.7}
                  style={[styles.cardActionBtn, { backgroundColor: accentColor + "10" }]}
                >
                  <Ionicons name="pencil" size={15} color={accentColor} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleDelete}
                  activeOpacity={0.7}
                  style={[styles.cardActionBtn, { backgroundColor: COLORS.danger + "10" }]}
                >
                  <Ionicons name="trash-outline" size={15} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Elegant Divider */}
          <View style={styles.heroDivider} />

          {/* Bottom Row: Total Amount & Your Share */}
          <View style={styles.heroAmountRow}>
            <View>
              <Text style={styles.amountLabel}>Total Amount</Text>
              <Text style={[styles.heroAmountText, { color: accentColor }]}>{currencySymbol}{expense.amount.toFixed(2)}</Text>
            </View>
            <View style={styles.heroSplitBlock}>
              <Text style={styles.splitLabel}>Your Share</Text>
              <Text style={[styles.heroSplitText, { color: accentColor }]}>{currencySymbol}{splitAmount.toFixed(2)}</Text>
            </View>
          </View>
        </AnimatedView>

        {/* Paid By */}
        <AnimatedView
          entering={FadeInDown.duration(400).delay(200)}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="card-outline" size={20} color={accentColor} />
            <Text style={styles.sectionTitle}>Paid By</Text>
          </View>
          <View style={styles.paidByCard}>
            <View style={[styles.paidByAvatar, { backgroundColor: accentColor + "20" }]}>
              <Text style={[styles.paidByAvatarText, { color: accentColor }]}>
                {expense.paidBy.name.substring(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={styles.paidByInfo}>
              <Text style={styles.paidByName}>{expense.paidBy.name}</Text>
              <Text style={styles.paidByEmail}>{expense.paidBy.email}</Text>
            </View>
            <Text style={[styles.paidByAmount, { color: accentColor }]}>
              {currencySymbol}{expense.amount.toFixed(2)}
            </Text>
          </View>
        </AnimatedView>

        {/* Attachment (if exists) */}
        {expense.attachment ? (
          <AnimatedView
            entering={FadeInDown.duration(400).delay(250)}
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <Ionicons name="document-attach-outline" size={20} color={accentColor} />
              <Text style={styles.sectionTitle}>Attachment</Text>
            </View>
            {(() => {
              const isPdf = expense.attachment.toLowerCase().endsWith(".pdf") || expense.attachment.toLowerCase().includes(".pdf");
              return (
                <TouchableOpacity
                  style={styles.attachmentCard}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    Linking.openURL(expense.attachment);
                  }}
                  activeOpacity={0.8}
                >
                  {isPdf ? (
                    <View style={[styles.attachmentPreview, { backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', borderRadius: 10 }]}>
                      <Ionicons name="document-text" size={32} color={COLORS.danger} />
                    </View>
                  ) : (
                    <Image source={{ uri: expense.attachment }} style={styles.attachmentPreview} />
                  )}
                  <View style={styles.attachmentInfo}>
                    <Text style={styles.attachmentTitle} numberOfLines={1}>
                      {isPdf ? "Receipt PDF" : "Receipt Image"}
                    </Text>
                    <Text style={styles.attachmentSubtitle}>Tap to view attachment</Text>
                  </View>
                  <Ionicons name="eye-outline" size={20} color={accentColor} style={styles.viewIcon} />
                </TouchableOpacity>
              );
            })()}
          </AnimatedView>
        ) : null}

        {/* Split Among */}
        <AnimatedView
          entering={FadeInDown.duration(400).delay(300)}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="people-outline" size={20} color={accentColor} />
            <Text style={styles.sectionTitle}>Split Among</Text>
            <Text style={[styles.memberCount, { color: accentColor }]}>
              {expense.splitBetween.length} people
            </Text>
          </View>
          <View style={styles.membersCard}>
            {expense.splitBetween.map((member, index) => {
              const isPayer = expense.paidBy._id === member._id;
              return (
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
                        isPayer && { backgroundColor: accentColor + "20" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.avatarText,
                          isPayer && { color: accentColor },
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
                      {currencySymbol}{getMemberSplitAmount(member._id).toFixed(2)}
                    </Text>
                    {expense.splits && expense.splits.length > 0 && (
                      <Text style={{ fontSize: 10, color: COLORS.gray, marginTop: 2 }}>
                        {expense.amount > 0 ? ((getMemberSplitAmount(member._id) / expense.amount) * 100).toFixed(0) : 0}%
                      </Text>
                    )}
                    {isPayer && (
                      <View style={[styles.paidBadge, { backgroundColor: accentColor + "15" }]}>
                        <Text style={[styles.paidBadgeText, { color: accentColor }]}>Paid</Text>
                      </View>
                    )}
                  </View>
                </AnimatedView>
              );
            })}
          </View>
        </AnimatedView>
        <View style={{ height: 40 }} />
      </ScrollView>
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
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    borderTopWidth: 4,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  compactIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTextContainer: {
    flex: 1,
  },
  descriptionText: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.dark,
    marginBottom: 4,
  },
  heroMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroDateText: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: "500",
  },
  bulletSeparator: {
    fontSize: 10,
    color: "#9CA3AF",
  },
  categoryMiniChipDetail: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryMiniChipDetailText: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  heroDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 14,
  },
  heroAmountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  amountLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  heroAmountText: {
    fontSize: 24,
    fontWeight: "800",
  },
  heroSplitBlock: {
    alignItems: "flex-end",
  },
  splitLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  heroSplitText: {
    fontSize: 24,
    fontWeight: "800",
  },
  cardActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
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
  attachmentCard: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  attachmentPreview: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 14,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 4,
  },
  attachmentSubtitle: {
    fontSize: 12,
    color: COLORS.gray,
  },
  viewIcon: {
    padding: 8,
  },
});
