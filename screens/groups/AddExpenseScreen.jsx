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
  Platform, Image,
  Modal,
} from "react-native";
import { groupService, categoryService } from "../../services/authService";
import { COLORS } from "../../utils/constants";
import Animated, { FadeInDown, FadeInUp, Layout, ZoomIn } from "react-native-reanimated";
import AnimatedView from "../../components/AnimatedView";
import * as Haptics from "expo-haptics";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import CustomAlert from "../../components/CustomAlert";
import { useAlert } from "../../hooks/useAlert";
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

const getInitials = (name) => {
  if (!name) return "?";
  return name.substring(0, 2).toUpperCase();
};

export default function AddExpenseScreen({ route, navigation }) {
  const { groupId, members, isEditing, expenseData } = route.params; const uniqueMembers = React.useMemo(() => { const seen = new Set(); const result = []; (members || []).forEach((m) => { if (m && m._id && !seen.has(m._id)) { seen.add(m._id); result.push(m); } }); return result; }, [members]);
  const { alertProps, showAlert } = useAlert(); const { user: currentUser } = useAuth();
  const [group, setGroup] = useState(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [paidBy, setPaidBy] = useState(() => {
    if (isEditing && expenseData && expenseData.paidBy) {
      return expenseData.paidBy._id || expenseData.paidBy;
    }
    const currentUserId = currentUser?.id || currentUser?._id;
    if (uniqueMembers.length <= 4 && currentUserId) {
      return currentUserId;
    }
    return currentUserId || (uniqueMembers[0]?._id || "");
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState(
    uniqueMembers.reduce((acc, member) => ({ ...acc, [member._id]: true }), {}),
  );
  const [splitType, setSplitType] = useState("equal");
  const [customAmounts, setCustomAmounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("receipt-outline");
  const [newCategoryColor, setNewCategoryColor] = useState("#6C63FF");
  const [creatingCategory, setCreatingCategory] = useState(false);

  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        const response = await groupService.getGroup(groupId);
        if (response.data) {
          setGroup(response.data);
        }
      } catch (error) {
        console.log("Failed to fetch group details in AddExpenseScreen:", error);
      }
    };
    fetchGroupDetails();
  }, [groupId]);

  const currencySymbol = group ? (CURRENCY_SYMBOLS[group.currency] || "₹") : "₹";

  useEffect(() => {
    if (isEditing && expenseData) {
      setAmount(expenseData.amount.toString());
      setDescription(expenseData.description); if (expenseData.paidBy) { setPaidBy(expenseData.paidBy._id || expenseData.paidBy); }

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
        const memberSelection = uniqueMembers.reduce((acc, member) => {
          acc[member._id] = expenseData.splitBetween.includes(member._id);
          return acc;
        }, {});
        setSelectedMembers(memberSelection);
      }
    } else {
      const currentUserId = currentUser?.id || currentUser?._id;
      if (uniqueMembers.length <= 4 && currentUserId) {
        setPaidBy(currentUserId);
      } else if (currentUserId) {
        setPaidBy(currentUserId);
      } else if (uniqueMembers && uniqueMembers.length > 0) {
        setPaidBy(uniqueMembers[0]._id);
      }
    }
  }, [isEditing, expenseData, uniqueMembers, currentUser]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoryService.getCategories();
        let cats = res.data || [];
        // Reorder: Move 'Others' to the first position
        const othersIndex = cats.findIndex(c => c.name.toLowerCase() === "others" || c.name === "Others");
        if (othersIndex > -1) {
          const othersCat = cats[othersIndex];
          cats.splice(othersIndex, 1);
          cats.unshift(othersCat);
        }
        setCategories(cats);
        
        if (isEditing && expenseData && expenseData.category) {
          setSelectedCategory(expenseData.category._id || expenseData.category);
        } else if (cats.length > 0) {
          setSelectedCategory(cats[0]._id);
        }
      } catch (error) {
        console.log("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, [isEditing, expenseData]);

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

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      showAlert({
        type: "error",
        title: "Missing Name",
        message: "Please enter a category name."
      });
      return;
    }
    setCreatingCategory(true);
    try {
      const res = await categoryService.createCategory(
        newCategoryName.trim(),
        newCategoryIcon,
        newCategoryColor
      );
      if (res.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const updatedCats = await categoryService.getCategories();
        setCategories(updatedCats.data || []);
        setSelectedCategory(res.data._id);
        setCategoryModalVisible(false);
        setNewCategoryName("");
      }
    } catch (error) {
      showAlert({
        type: "error",
        title: "Failed to Create",
        message: error.response?.data?.message || "Failed to create category"
      });
    } finally {
      setCreatingCategory(false);
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
        showAlert({ type: "warning", title: "Amount Mismatch", message: `Total split (${currencySymbol}${totalEntered.toFixed(2)}) must equal the expense amount (${currencySymbol}${targetAmount.toFixed(2)}).` });
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
          description.trim(), paidBy, selectedCategory
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showAlert({
          type: "success", title: "Expense Updated!", message: "Your expense has been updated successfully.", dismissible: false, buttons: [
            { text: "OK", onPress: () => navigation.goBack() },
          ]
        });
      } else {
        await groupService.addExpense(
          groupId,
          parseFloat(amount),
          finalSplitData,
          description.trim(), paidBy, selectedCategory
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showAlert({
          type: "success", title: "Expense Added!", message: "The expense has been added and split successfully.", dismissible: false, buttons: [
            { text: "Great!", onPress: () => navigation.goBack() },
          ]
        });
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
            <MaterialIcons name="receipt-long" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>
              {isEditing ? "Edit Expense" : "New Expense"}
            </Text>
            <Text style={styles.headerSubtitle}>
              Enter details below to track spending
            </Text>
          </View>
        </AnimatedView>

        {/* Input Form */}
        <AnimatedView entering={FadeInDown.duration(400).delay(200)} style={styles.formCard}>
          <View style={[styles.inputGroup, focusedInput === 'amount' && styles.inputGroupFocused]}>
            <View style={styles.currencySymbolContainer}>
              <Text style={styles.currencySymbol}>{currencySymbol}</Text>
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

        {/* Category Selector */}
        <AnimatedView entering={FadeInDown.duration(400).delay(220)}>
          <Text style={styles.sectionLabel}>Category</Text>
          <View style={styles.categoryCard}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat._id;
                const activeColor = cat.color || COLORS.primary;
                return (
                  <TouchableOpacity
                    key={cat._id}
                    style={[
                      styles.categoryBubble,
                      isSelected && { borderColor: activeColor, backgroundColor: activeColor + "08" }
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedCategory(cat._id);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.categoryIconCircle, { backgroundColor: activeColor + "15" }]}>
                      <Ionicons name={cat.icon || "receipt-outline"} size={20} color={activeColor} />
                      {isSelected && (
                        <AnimatedView entering={ZoomIn} style={[styles.categoryCheckBadge, { backgroundColor: activeColor }]}>
                          <Ionicons name="checkmark" size={10} color={COLORS.white} />
                        </AnimatedView>
                      )}
                    </View>
                    <Text style={[styles.categoryLabelText, isSelected && { color: activeColor, fontWeight: "bold" }]} numberOfLines={1}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              
              {/* Add Custom Category Button */}
              <TouchableOpacity
                style={styles.categoryBubble}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCategoryModalVisible(true);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.categoryIconCircle, { backgroundColor: "#E5E7EB", borderStyle: "dashed", borderWidth: 1.5, borderColor: "#9CA3AF" }]}>
                  <Ionicons name="add-outline" size={22} color="#4B5563" />
                </View>
                <Text style={styles.categoryLabelText} numberOfLines={1}>
                  Custom
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </AnimatedView>

        {/* Paid By Member Selector */}
        <AnimatedView entering={FadeInDown.duration(400).delay(250)}>
          <Text style={styles.sectionLabel}>Paid By</Text>
          {uniqueMembers.length <= 4 ? (
            <View style={styles.payerCard}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.payerScroll}>
                {uniqueMembers.map((member) => {
                  const isSelected = paidBy === member._id;
                  const memberInitial = (member.name ?? member.email ?? "?")[0].toUpperCase();
                  const displayName = member._id === (currentUser?.id || currentUser?._id) ? "You" : member.name.split(" ")[0];
                  return (
                    <TouchableOpacity
                      key={member._id}
                      style={[styles.payerBubbleContainer, isSelected && styles.payerBubbleSelected]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setPaidBy(member._id);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.payerAvatarWrapper}>
                        {member.avatar ? (
                          <Image source={{ uri: member.avatar }} style={styles.payerAvatarImage} />
                        ) : (
                          <View style={[styles.payerAvatarFallback, { backgroundColor: COLORS.primary + "15" }]}>
                            <Text style={styles.payerAvatarText}>{memberInitial}</Text>
                          </View>
                        )}
                        {isSelected && (
                          <AnimatedView entering={ZoomIn} style={styles.payerBadge}>
                            <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                          </AnimatedView>
                        )}
                      </View>
                      <Text style={[styles.payerName, isSelected && styles.payerNameSelected]} numberOfLines={1}>
                        {displayName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ) : (
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={[styles.dropdownHeader, dropdownOpen && styles.dropdownHeaderActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setDropdownOpen(!dropdownOpen);
                }}
                activeOpacity={0.8}
              >
                <View style={styles.selectedPayerInfo}>
                  {(() => {
                    const selectedPayerObj = uniqueMembers.find((m) => m._id === paidBy) || uniqueMembers[0];
                    const selectedPayerInitial = (selectedPayerObj?.name ?? selectedPayerObj?.email ?? "?")[0].toUpperCase();
                    const selectedPayerDisplayName = selectedPayerObj?._id === (currentUser?.id || currentUser?._id) ? "You" : selectedPayerObj?.name;
                    return (
                      <>
                        {selectedPayerObj?.avatar ? (
                          <Image source={{ uri: selectedPayerObj.avatar }} style={styles.dropdownAvatarImage} />
                        ) : (
                          <View style={[styles.dropdownAvatarFallback, { backgroundColor: COLORS.primary + "15" }]}>
                            <Text style={styles.dropdownAvatarText}>{selectedPayerInitial}</Text>
                          </View>
                        )}
                        <View style={styles.selectedPayerTextContainer}>
                          <Text style={styles.dropdownSelectedLabel}>Who Paid?</Text>
                          <Text style={styles.dropdownSelectedValue}>{selectedPayerDisplayName}</Text>
                        </View>
                      </>
                    );
                  })()}
                </View>
                <Ionicons
                  name={dropdownOpen ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={COLORS.gray}
                />
              </TouchableOpacity>

              {dropdownOpen && (
                <AnimatedView entering={FadeInUp.duration(200)} style={styles.dropdownList}>
                  {uniqueMembers.map((member, index) => {
                    const isSelected = paidBy === member._id;
                    const memberInitial = (member.name ?? member.email ?? "?")[0].toUpperCase();
                    return (
                      <TouchableOpacity
                        key={member._id}
                        style={[
                          styles.dropdownItem,
                          isSelected && styles.dropdownItemActive,
                          index !== uniqueMembers.length - 1 && styles.dropdownItemBorder,
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          setPaidBy(member._id);
                          setDropdownOpen(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.dropdownItemLeft}>
                          {member.avatar ? (
                            <Image source={{ uri: member.avatar }} style={styles.dropdownItemAvatarImage} />
                          ) : (
                            <View style={[styles.dropdownItemAvatarFallback, { backgroundColor: COLORS.primary + "15" }]}>
                              <Text style={styles.dropdownItemAvatarText}>{memberInitial}</Text>
                            </View>
                          )}
                          <Text style={[styles.dropdownItemName, isSelected && styles.dropdownItemNameSelected]}>
                            {member._id === (currentUser?.id || currentUser?._id) ? "You" : member.name}
                          </Text>
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </AnimatedView>
              )}
            </View>
          )}
        </AnimatedView>

        {/* Split Type Toggle */}
        <AnimatedView entering={FadeInDown.duration(400).delay(300)}>
          <Text style={styles.sectionLabel}>Split Method</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.splitTypeScroll}
            contentContainerStyle={styles.splitTypeScrollContent}
          >
            <TouchableOpacity
              style={[
                styles.splitTypeButtonNew,
                splitType === "equal" && styles.splitTypeButtonActive,
              ]}
              onPress={() => handleSplitTypeChange("equal")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="people-outline"
                size={16}
                color={splitType === "equal" ? COLORS.white : COLORS.gray}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.splitTypeTextNew,
                  splitType === "equal" && styles.splitTypeTextActive,
                ]}
              >
                Equally
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.splitTypeButtonNew,
                splitType === "custom" && styles.splitTypeButtonActive,
              ]}
              onPress={() => handleSplitTypeChange("custom")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="options-outline"
                size={16}
                color={splitType === "custom" ? COLORS.white : COLORS.gray}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.splitTypeTextNew,
                  splitType === "custom" && styles.splitTypeTextActive,
                ]}
              >
                Custom Amount
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </AnimatedView>

        {/* Members List */}
        <AnimatedView entering={FadeInDown.duration(400).delay(400)}>
          <View style={styles.membersHeaderRow}>
            <Text style={styles.sectionLabel}>Split With</Text>
            <Text style={styles.membersCount}>{selectedCount} selected</Text>
          </View>

          <View style={styles.membersCard}>
            {uniqueMembers.map((member, index) => (
              <AnimatedView
                key={member._id}
                layout={Layout.springify()}
                style={[
                  styles.memberRow,
                  index !== uniqueMembers.length - 1 && styles.memberRowBorder
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
                      <Text style={styles.customCurrency}>{currencySymbol}</Text>
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
                <Text style={styles.summaryValue}>{currencySymbol}{perPersonAmount}</Text>
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
                  {Math.abs(remaining) < 0.01 ? `Total: ${currencySymbol}${parseFloat(amount).toFixed(2)}` : `${currencySymbol}${Math.abs(remaining).toFixed(2)}`}
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

      {/* Custom Category Creation Sheet/Modal */}
      <Modal
        visible={categoryModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContainer}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create Custom Category</Text>
                <TouchableOpacity
                  onPress={() => setCategoryModalVisible(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={20} color={COLORS.dark} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
                {/* Category Name Input */}
                <Text style={styles.modalLabel}>Category Name</Text>
                <View style={styles.modalInputGroup}>
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="E.g. Gym, Pet Care, Gifts"
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                    placeholderTextColor={COLORS.gray}
                  />
                </View>

                {/* Color Selector */}
                <Text style={styles.modalLabel}>Choose Theme Color</Text>
                <View style={styles.colorPaletteGrid}>
                  {[
                    "#6C63FF", // Violet
                    "#FF6584", // Soft Red
                    "#FB8C00", // Orange
                    "#8E24AA", // Purple
                    "#00ACC1", // Teal
                    "#00897B", // Deep Green
                    "#4CAF50", // Green
                    "#E91E63", // Pink
                  ].map((color) => {
                    const isColorSelected = newCategoryColor === color;
                    return (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.colorPalettePill,
                          { backgroundColor: color },
                          isColorSelected && styles.colorPalettePillActive,
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setNewCategoryColor(color);
                        }}
                      />
                    );
                  })}
                </View>

                {/* Icon Selector */}
                <Text style={styles.modalLabel}>Choose Icon</Text>
                <View style={styles.iconSelectionGrid}>
                  {[
                    "receipt-outline",
                    "fast-food-outline",
                    "car-outline",
                    "home-outline",
                    "film-outline",
                    "cart-outline",
                    "gift-outline",
                    "medkit-outline",
                    "book-outline",
                    "barbell-outline",
                    "paw-outline",
                    "briefcase-outline",
                  ].map((iconName) => {
                    const isIconSelected = newCategoryIcon === iconName;
                    return (
                      <TouchableOpacity
                        key={iconName}
                        style={[
                          styles.iconSelectionPill,
                          isIconSelected && { backgroundColor: newCategoryColor + "15", borderColor: newCategoryColor }
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setNewCategoryIcon(iconName);
                        }}
                      >
                        <Ionicons
                          name={iconName}
                          size={22}
                          color={isIconSelected ? newCategoryColor : COLORS.gray}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              <TouchableOpacity
                style={[styles.modalSubmitButton, { backgroundColor: newCategoryColor }]}
                onPress={handleCreateCategory}
                disabled={creatingCategory}
              >
                {creatingCategory ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.modalSubmitButtonText}>Create Category</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  dropdownContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    overflow: "hidden",
  },
  dropdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: COLORS.white,
  },
  dropdownHeaderActive: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  selectedPayerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dropdownAvatarImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F3F4F6",
  },
  dropdownAvatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  dropdownAvatarText: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  selectedPayerTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  dropdownSelectedLabel: {
    fontSize: 10,
    color: COLORS.gray,
    textTransform: "uppercase",
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  dropdownSelectedValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.dark,
  },
  dropdownList: {
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginVertical: 2,
  },
  dropdownItemActive: {
    backgroundColor: COLORS.primary + "08",
  },
  dropdownItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dropdownItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dropdownItemAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
  },
  dropdownItemAvatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dropdownItemAvatarText: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  dropdownItemName: {
    fontSize: 14,
    color: COLORS.dark,
    marginLeft: 10,
    fontWeight: "500",
  },
  dropdownItemNameSelected: {
    fontWeight: "bold",
    color: COLORS.primary,
  },
  payerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  payerScroll: {
    paddingHorizontal: 4,
  },
  payerBubbleContainer: {
    alignItems: "center",
    marginRight: 12,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "transparent",
    width: 68,
  },
  payerBubbleSelected: {
    borderColor: COLORS.primary + "30",
    backgroundColor: COLORS.primary + "08",
  },
  payerAvatarWrapper: {
    position: "relative",
    marginBottom: 6,
  },
  payerAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  payerAvatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  payerAvatarText: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  payerBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  payerName: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: "500",
    textAlign: "center",
    width: "100%",
  },
  payerNameSelected: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  content: {
    padding: 16,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: COLORS.primary + '12',
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.dark,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.gray,
    textAlign: "left",
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
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
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#F5F5F5",
    borderRightWidth: 1,
    borderRightColor: "#E0E0E0",
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.dark,
  },
  amountInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.dark,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputIcon: {
    paddingHorizontal: 14,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.dark,
    paddingVertical: 12,
    paddingRight: 14,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 8,
    marginLeft: 4,
  },
  splitTypeContainer: {
    flexDirection: "row",
    backgroundColor: "#EEEEEE",
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  splitTypeButton: {
    flex: 1,
    paddingVertical: 10,
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
    fontSize: 14,
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
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "600",
    marginBottom: 8,
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
    marginBottom: 16,
  },
  memberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  memberName: {
    fontSize: 15,
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
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: COLORS.primary + "35",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  customCurrency: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
    marginRight: 2,
  },
  customAmountInput: {
    width: 65,
    paddingVertical: 6,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.dark,
    textAlign: "right",
  },
  switch: {
    transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }],
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary + '10',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
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
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 2,
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    paddingVertical: 14,
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
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
  },
  splitTypeScroll: {
    marginBottom: 16,
  },
  splitTypeScrollContent: {
    gap: 10,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  splitTypeButtonNew: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  splitTypeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  splitTypeTextNew: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.gray,
  },
  splitTypeTextActive: {
    color: COLORS.white,
  },
  categoryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  categoryScroll: {
    paddingHorizontal: 4,
  },
  categoryBubble: {
    alignItems: "center",
    marginRight: 16,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "transparent",
    width: 74,
  },
  categoryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    position: "relative",
  },
  categoryCheckBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    borderRadius: 7,
    width: 14,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.white,
  },
  categoryLabelText: {
    fontSize: 10,
    color: COLORS.gray,
    fontWeight: "500",
    textAlign: "center",
    width: "100%",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    width: "100%",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.dark,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.dark,
    marginBottom: 8,
    marginTop: 10,
  },
  modalInputGroup: {
    borderWidth: 1.5,
    borderColor: "#F0F0F0",
    borderRadius: 12,
    backgroundColor: "#FAFAFA",
    marginBottom: 16,
  },
  modalTextInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.dark,
  },
  colorPaletteGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  colorPalettePill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 3,
    borderColor: "transparent",
  },
  colorPalettePillActive: {
    borderColor: "#E5E7EB",
  },
  iconSelectionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  iconSelectionPill: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  modalSubmitButton: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  modalSubmitButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "bold",
  },
});
