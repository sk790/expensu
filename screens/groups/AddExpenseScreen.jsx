import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { groupService } from "../../services/authService";
import { COLORS } from "../../utils/constants";

export default function AddExpenseScreen({ route, navigation }) {
  const { groupId, members, isEditing, expenseData } = route.params;
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState(
    members.reduce((acc, member) => ({ ...acc, [member._id]: true }), {}),
  );
  const [splitType, setSplitType] = useState("equal");
  const [customAmounts, setCustomAmounts] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Pre-fill form data if editing
    if (isEditing && expenseData) {
      setAmount(expenseData.amount.toString());
      setDescription(expenseData.description);

      // Check if it was a custom split
      // This depends on how backend returns splitBetween.
      // Assuming for now if it's editing, we default to equal or check data structure.
      // If expenseData.splitBetween is array of objects with amount, set custom.
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
        // Equal split logic (existing)
        const memberSelection = members.reduce((acc, member) => {
          acc[member._id] = expenseData.splitBetween.includes(member._id);
          return acc;
        }, {});
        setSelectedMembers(memberSelection);
      }
    }
  }, [isEditing, expenseData]);

  const handleCustomAmountChange = (memberId, value) => {
    setCustomAmounts((prev) => ({
      ...prev,
      [memberId]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!amount || !description.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    const selectedIds = Object.keys(selectedMembers).filter(
      (id) => selectedMembers[id],
    );
    if (selectedIds.length === 0) {
      Alert.alert("Error", "Please select at least one member to split with");
      return;
    }

    let finalSplitData = selectedIds; // Default equal split (sending IDs)

    if (splitType === "custom") {
      // Validate Custom Amounts
      const totalEntered = selectedIds.reduce(
        (sum, id) => sum + (parseFloat(customAmounts[id]) || 0),
        0,
      );
      const targetAmount = parseFloat(amount);

      if (Math.abs(totalEntered - targetAmount) > 0.01) {
        Alert.alert(
          "Error",
          `Total split amount (₹${totalEntered.toFixed(2)}) must equal expense amount (₹${targetAmount.toFixed(2)})`,
        );
        return;
      }

      // Construct payload for custom split
      finalSplitData = selectedIds.map((id) => ({
        userId: id,
        amount: parseFloat(customAmounts[id]) || 0,
      }));
    }

    setLoading(true);
    try {
      if (isEditing && expenseData) {
        // Edit existing expense
        await groupService.editExpense(
          groupId,
          expenseData.id,
          parseFloat(amount),
          finalSplitData,
          description.trim(),
        );
        Alert.alert("Success", "Expense updated successfully", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        // Add new expense
        await groupService.addExpense(
          groupId,
          parseFloat(amount),
          finalSplitData,
          description.trim(),
        );
        Alert.alert("Success", "Expense added successfully", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to save expense",
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleMember = (memberId) => {
    setSelectedMembers((prev) => ({
      ...prev,
      [memberId]: !prev[memberId],
    }));
  };

  const selectedCount = Object.values(selectedMembers).filter(Boolean).length;

  // Validation info for UI
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.form}>
        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter amount"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          editable={!loading}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          placeholder="What's this expense for?"
          value={description}
          onChangeText={setDescription}
          editable={!loading}
        />

        <Text style={styles.label}>Split Type</Text>
        <View style={styles.splitTypeContainer}>
          <TouchableOpacity
            style={[
              styles.splitTypeButton,
              splitType === "equal" && styles.activeSplitType,
            ]}
            onPress={() => setSplitType("equal")}
          >
            <Text
              style={[
                styles.splitTypeText,
                splitType === "equal" && styles.activeSplitTypeText,
              ]}
            >
              Equally
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.splitTypeButton,
              splitType === "custom" && styles.activeSplitType,
            ]}
            onPress={() => setSplitType("custom")}
          >
            <Text
              style={[
                styles.splitTypeText,
                splitType === "custom" && styles.activeSplitTypeText,
              ]}
            >
              Custom
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Split Between</Text>
        <View style={styles.membersContainer}>
          {members.map((member) => (
            <View key={member._id} style={styles.memberRow}>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.name}</Text>
                {splitType === "custom" && selectedMembers[member._id] && (
                  <TextInput
                    style={styles.customAmountInput}
                    placeholder="0"
                    keyboardType="numeric"
                    value={customAmounts[member._id] || ""}
                    onChangeText={(val) =>
                      handleCustomAmountChange(member._id, val)
                    }
                  />
                )}
              </View>
              <Switch
                value={selectedMembers[member._id]}
                onValueChange={() => toggleMember(member._id)}
                disabled={loading}
                trackColor={{ false: COLORS.gray, true: COLORS.primary }}
              />
            </View>
          ))}
        </View>

        {amount && selectedCount > 0 && splitType === "equal" && (
          <View style={styles.splitInfo}>
            <Text style={styles.splitText}>
              Each person pays: ₹{perPersonAmount}
            </Text>
          </View>
        )}

        {amount && splitType === "custom" && (
          <View
            style={[
              styles.splitInfo,
              Math.abs(remaining) > 0.01
                ? styles.splitError
                : styles.splitSuccess,
            ]}
          >
            <Text style={styles.splitText}>
              Total: ₹{currentTotal.toFixed(2)} / ₹
              {parseFloat(amount).toFixed(2)}
            </Text>
            <Text style={styles.subText}>
              {Math.abs(remaining) < 0.01
                ? "Perfect match!"
                : `${remaining > 0 ? "Remaining" : "Exceeded"}: ₹${Math.abs(remaining).toFixed(2)}`}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading
              ? "Saving..."
              : isEditing
                ? "Update Expense"
                : "Add Expense"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  form: {
    marginTop: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 10,
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.light,
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: COLORS.light,
  },
  membersContainer: {
    backgroundColor: COLORS.light,
    borderRadius: 8,
    padding: 10,
  },
  memberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  memberName: {
    fontSize: 16,
    color: COLORS.dark,
  },
  splitInfo: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: "center",
  },
  splitText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 30,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  splitTypeContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.light,
    borderRadius: 8,
    padding: 4,
    marginBottom: 10,
  },
  splitTypeButton: {
    flex: 1,
    padding: 10,
    alignItems: "center",
    borderRadius: 6,
  },
  activeSplitType: {
    backgroundColor: COLORS.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  splitTypeText: {
    color: COLORS.gray,
    fontWeight: "600",
  },
  activeSplitTypeText: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  memberInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginRight: 10,
  },
  customAmountInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 6,
    padding: 8,
    width: 80,
    textAlign: "right",
  },
  splitError: {
    backgroundColor: "#ff6b6b",
  },
  splitSuccess: {
    backgroundColor: COLORS.success,
  },
  subText: {
    color: COLORS.white,
    fontSize: 12,
    marginTop: 4,
  },
});
