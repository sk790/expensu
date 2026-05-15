import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { groupService } from "../../services/authService";
import { COLORS } from "../../utils/constants";
import Animated, { FadeInDown, FadeInUp, Layout, ZoomIn } from "react-native-reanimated";
import AnimatedView from "../../components/AnimatedView";
import * as Haptics from "expo-haptics";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import CustomAlert from "../../components/CustomAlert";
import { useAlert } from "../../hooks/useAlert";

const getInitials = (name) => {
  if (!name) return "?";
  return name.substring(0, 2).toUpperCase();
};

export default function AddExpenseScreen({ route, navigation }) {
  const { groupId, members, isEditing, expenseData } = route.params;
  const { alertProps, showAlert } = useAlert();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState(
    members.reduce((acc, member) => ({ ...acc, [member._id]: true }), {}),
  );
  const [splitType, setSplitType] = useState("equal");
  const [customAmounts, setCustomAmounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  useEffect(() => {
    if (isEditing && expenseData) {
      setAmount(expenseData.amount.toString());
      setDescription(expenseData.description);

      const isCustom = expenseData.splitBetween.some(
        (item) => typeof item === "object" && item.amount,
      );

      if (isCustom) {
        setSplitType("custom");
        const memberSelection = {};
        const amounts = {};
        expenseData.splitBetween.forEach((item) => {
          memberSelection[item.paidBy || item.userId || item._id] = true;
          amounts[item.paidBy || item.userId || item._id] =
            item.amount.toString();
        });
        setSelectedMembers(memberSelection);
        setCustomAmounts(amounts);
      } else {
        const memberSelection = members.reduce((acc, member) => {
          acc[member._id] = expenseData.splitBetween.includes(member._id);
          return acc;
        }, {});
        setSelectedMembers(memberSelection);
      }
    }
  }, [isEditing, expenseData, members]);

  const handleCustomAmountChange = (memberId, value) => {
    setCustomAmounts((prev) => ({
      ...prev,
      [memberId]: value,
    }));
  };

  const handleSplitTypeChange = (type) => {
    if (splitType !== type) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSplitType(type);
    }
  };

  const handleSubmit = async () => {
    if (!amount || !description.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert({ type: "error", title: "Missing Details", message: "Please fill in all fields before saving." });
      return;
    }

    const selectedIds = Object.keys(selectedMembers).filter(
      (id) => selectedMembers[id],
    );
    if (selectedIds.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert({ type: "error", title: "No Members Selected", message: "Please select at least one member to split with." });
      return;
    }

    let finalSplitData = selectedIds;

    if (splitType === "custom") {
      const totalEntered = selectedIds.reduce(
        (sum, id) => sum + (parseFloat(customAmounts[id]) || 0),
        0,
      );
      const targetAmount = parseFloat(amount);

      if (Math.abs(totalEntered - targetAmount) > 0.01) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showAlert({ type: "warning", title: "Amount Mismatch", message: `Total split (₹${totalEntered.toFixed(2)}) must equal the expense amount (₹${targetAmount.toFixed(2)}).` });
        return;
      }

      finalSplitData = selectedIds.map((id) => ({
        userId: id,
        amount: parseFloat(customAmounts[id]) || 0,
      }));
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      if (isEditing && expenseData) {
        await groupService.editExpense(
          groupId,
          expenseData.id,
          parseFloat(amount),
          finalSplitData,
          description.trim(),
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showAlert({ type: "success", title: "Expense Updated!", message: "Your expense has been updated successfully.", buttons: [
          { text: "OK", onPress: () => navigation.goBack() },
        ]});
      } else {
        await groupService.addExpense(
          groupId,
          parseFloat(amount),
          finalSplitData,
          description.trim(),
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showAlert({ type: "success", title: "Expense Added!", message: "The expense has been added and split successfully.", buttons: [
          { text: "Great!", onPress: () => navigation.goBack() },
        ]});
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert({ type: "error", title: "Failed to Save", message: error.response?.data?.message || "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const toggleMember = (memberId) => {
    Haptics.selectionAsync();
    setSelectedMembers((prev) => ({
      ...prev,
      [memberId]: !prev[memberId],
    }));
  };

  const selectedCount = Object.values(selectedMembers).filter(Boolean).length;

  const currentTotal = Object.keys(selectedMembers)
    .filter((id) => selectedMembers[id])
    .reduce((sum, id) => sum + (parseFloat(customAmounts[id]) || 0), 0);
  const remaining = parseFloat(amount || 0) - currentTotal;

  const perPersonAmount =
    amount && selectedCount > 0
      ? (parseFloat(amount) / selectedCount).toFixed(2)
      : "0.00";

  if (loading && isEditing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
    >
      <CustomAlert {...alertProps} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        
        {/* Header / Title Area */}
        <AnimatedView entering={FadeInDown.duration(400).delay(100)} style={styles.headerContainer}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="receipt-long" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.headerTitle}>
            {isEditing ? "Edit Expense" : "New Expense"}
          </Text>
          <Text style={styles.headerSubtitle}>
            Enter the details below to track your spending
          </Text>
        </AnimatedView>

        {/* Input Form */}
        <AnimatedView entering={FadeInDown.duration(400).delay(200)} style={styles.formCard}>
          <View style={[styles.inputGroup, focusedInput === 'amount' && styles.inputGroupFocused]}>
            <View style={styles.currencySymbolContainer}>
              <Text style={styles.currencySymbol}>₹</Text>
            </View>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor={COLORS.gray}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              editable={!loading}
              onFocus={() => setFocusedInput('amount')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          <View style={[styles.inputGroup, focusedInput === 'desc' && styles.inputGroupFocused, { marginTop: 16 }]}>
            <Ionicons name="create-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="What was this for?"
              placeholderTextColor={COLORS.gray}
              value={description}
              onChangeText={setDescription}
              editable={!loading}
              onFocus={() => setFocusedInput('desc')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>
        </AnimatedView>

        {/* Split Type Toggle */}
        <AnimatedView entering={FadeInDown.duration(400).delay(300)}>
          <Text style={styles.sectionLabel}>Split Method</Text>
          <View style={styles.splitTypeContainer}>
            <TouchableOpacity
              style={styles.splitTypeButton}
              onPress={() => handleSplitTypeChange("equal")}
              activeOpacity={0.8}
            >
              {splitType === "equal" && (
                <AnimatedView layout={Layout.springify()} style={styles.activeSplitBg} />
              )}
              <Text style={[styles.splitTypeText, splitType === "equal" && styles.activeSplitTypeText]}>
                Equally
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.splitTypeButton}
              onPress={() => handleSplitTypeChange("custom")}
              activeOpacity={0.8}
            >
              {splitType === "custom" && (
                <AnimatedView layout={Layout.springify()} style={styles.activeSplitBg} />
              )}
              <Text style={[styles.splitTypeText, splitType === "custom" && styles.activeSplitTypeText]}>
                Custom
              </Text>
            </TouchableOpacity>
          </View>
        </AnimatedView>

        {/* Members List */}
        <AnimatedView entering={FadeInDown.duration(400).delay(400)}>
          <View style={styles.membersHeaderRow}>
            <Text style={styles.sectionLabel}>Split With</Text>
            <Text style={styles.membersCount}>{selectedCount} selected</Text>
          </View>
          
          <View style={styles.membersCard}>
            {members.map((member, index) => (
              <AnimatedView 
                key={member._id} 
                layout={Layout.springify()}
                style={[
                  styles.memberRow, 
                  index !== members.length - 1 && styles.memberRowBorder
                ]}
              >
                <View style={styles.memberInfo}>
                  <View style={[styles.avatar, { backgroundColor: COLORS.primary + '20' }]}>
                    <Text style={styles.avatarText}>{getInitials(member.name)}</Text>
                  </View>
                  <Text style={styles.memberName}>{member.name}</Text>
                </View>

                <View style={styles.memberAction}>
                  {splitType === "custom" && selectedMembers[member._id] && (
                    <AnimatedView entering={ZoomIn} style={styles.customAmountContainer}>
                      <Text style={styles.customCurrency}>₹</Text>
                      <TextInput
                        style={styles.customAmountInput}
                        placeholder="0"
                        placeholderTextColor={COLORS.gray}
                        keyboardType="decimal-pad"
                        value={customAmounts[member._id] || ""}
                        onChangeText={(val) => handleCustomAmountChange(member._id, val)}
                      />
                    </AnimatedView>
                  )}
                  <Switch
                    value={selectedMembers[member._id]}
                    onValueChange={() => toggleMember(member._id)}
                    disabled={loading}
                    trackColor={{ false: "#E0E0E0", true: COLORS.primary + '80' }}
                    thumbColor={selectedMembers[member._id] ? COLORS.primary : "#f4f3f4"}
                    ios_backgroundColor="#E0E0E0"
                    style={styles.switch}
                  />
                </View>
              </AnimatedView>
            ))}
          </View>
        </AnimatedView>

        {/* Summary Footer */}
        <AnimatedView entering={FadeInUp.duration(500).delay(500)}>
          {amount && selectedCount > 0 && splitType === "equal" && (
            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <Ionicons name="pie-chart" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.summaryTextContainer}>
                <Text style={styles.summaryLabel}>Each person pays</Text>
                <Text style={styles.summaryValue}>₹{perPersonAmount}</Text>
              </View>
            </View>
          )}

          {amount && splitType === "custom" && (
            <View style={[styles.summaryCard, Math.abs(remaining) > 0.01 ? styles.summaryError : styles.summarySuccess]}>
              <View style={styles.summaryIcon}>
                <Ionicons 
                  name={Math.abs(remaining) > 0.01 ? "alert-circle" : "checkmark-circle"} 
                  size={24} 
                  color={Math.abs(remaining) > 0.01 ? COLORS.danger : COLORS.success} 
                />
              </View>
              <View style={styles.summaryTextContainer}>
                <Text style={[styles.summaryLabel, { color: Math.abs(remaining) > 0.01 ? COLORS.danger : COLORS.success }]}>
                  {Math.abs(remaining) < 0.01
                    ? "Perfect match!"
                    : `${remaining > 0 ? "Remaining" : "Exceeded"} amount`}
                </Text>
                <Text style={[styles.summaryValue, { color: Math.abs(remaining) > 0.01 ? COLORS.danger : COLORS.success }]}>
                  {Math.abs(remaining) < 0.01 ? `Total: ₹${parseFloat(amount).toFixed(2)}` : `₹${Math.abs(remaining).toFixed(2)}`}
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Text style={styles.saveButtonText}>
                  {isEditing ? "Update Expense" : "Save Expense"}
                </Text>
                <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
              </>
            )}
          </TouchableOpacity>
        </AnimatedView>
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  content: {
    padding: 20,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  headerContainer: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary + '15',
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: "center",
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#F0F0F0",
    borderRadius: 12,
    backgroundColor: "#FAFAFA",
    overflow: 'hidden',
  },
  inputGroupFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  currencySymbolContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#F5F5F5",
    borderRightWidth: 1,
    borderRightColor: "#E0E0E0",
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.dark,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.dark,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  inputIcon: {
    paddingHorizontal: 16,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.dark,
    paddingVertical: 16,
    paddingRight: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 12,
    marginLeft: 4,
  },
  splitTypeContainer: {
    flexDirection: "row",
    backgroundColor: "#EEEEEE",
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  splitTypeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    position: 'relative',
    zIndex: 1,
  },
  activeSplitBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    zIndex: -1,
  },
  splitTypeText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.gray,
  },
  activeSplitTypeText: {
    color: COLORS.dark,
    fontWeight: "bold",
  },
  membersHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  membersCount: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "600",
    marginBottom: 12,
    marginRight: 4,
  },
  membersCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 24,
  },
  memberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  memberRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  memberName: {
    fontSize: 16,
    color: COLORS.dark,
    fontWeight: "500",
  },
  memberAction: {
    flexDirection: "row",
    alignItems: "center",
  },
  customAmountContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    paddingHorizontal: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  customCurrency: {
    fontSize: 14,
    color: COLORS.gray,
    marginRight: 4,
  },
  customAmountInput: {
    width: 60,
    paddingVertical: 8,
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.dark,
    textAlign: "right",
  },
  switch: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary + '10',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  summaryError: {
    backgroundColor: COLORS.danger + '10',
    borderColor: COLORS.danger + '30',
  },
  summarySuccess: {
    backgroundColor: COLORS.success + '10',
    borderColor: COLORS.success + '30',
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTextContainer: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 4,
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 8,
  },
});
