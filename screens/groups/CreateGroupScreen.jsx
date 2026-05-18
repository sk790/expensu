import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Share,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { groupService, userService } from "../../services/authService";
import { COLORS, SHADOWS } from "../../utils/constants";
import { FadeInDown, FadeInUp, ZoomIn } from "react-native-reanimated";
import AnimatedView from "../../components/AnimatedView";
import * as Haptics from "expo-haptics";
import CustomAlert from "../../components/CustomAlert";
import { useAlert } from "../../hooks/useAlert";

const SUPPORTED_CURRENCIES = [
  { code: "INR", label: "Indian Rupee (₹)", symbol: "₹" },
  { code: "USD", label: "US Dollar ($)", symbol: "$" },
  { code: "EUR", label: "Euro (€)", symbol: "€" },
  { code: "GBP", label: "British Pound (£)", symbol: "£" },
  { code: "JPY", label: "Japanese Yen (¥)", symbol: "¥" },
  { code: "CAD", label: "Canadian Dollar (C$)", symbol: "C$" },
  { code: "AUD", label: "Australian Dollar (A$)", symbol: "A$" },
];

export default function CreateGroupScreen({ navigation, route }) {
  const groupToEdit = route.params?.group;
  const isEditing = !!groupToEdit;
  const insets = useSafeAreaInsets();

  const [groupName, setGroupName] = useState(groupToEdit?.name || "");
  const [currency, setCurrency] = useState(groupToEdit?.currency || "INR");
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const { alertProps, showAlert } = useAlert();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 1) {
        performSearch(searchQuery.trim());
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = async (query) => {
    setSearching(true);
    try {
      const response = await userService.searchUserByEmail(query);
      if (response.user) {
        setSearchResults([response.user]);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const toggleMember = (user) => {
    const isSelected = selectedMembers.some((m) => m.id === user.id);
    if (isSelected) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedMembers(selectedMembers.filter((m) => m.id !== user.id));
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setSelectedMembers([...selectedMembers, user]);
      setSearchQuery("");
      setSearchResults([]);
    }
  };

  const handleAction = async () => {
    if (!groupName.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert({
        type: "error",
        title: "Missing Name",
        message: "Please give your group a name.",
      });
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    try {
      if (isEditing) {
        await groupService.updateGroup(groupToEdit._id, groupName.trim(), currency);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showAlert({
          type: "success",
          title: "Group Updated! ✨",
          message: `"${groupName}" has been successfully updated.`,
          buttons: [{ text: "Awesome", onPress: () => navigation.goBack() }],
        });
      } else {
        const memberIds = selectedMembers.map((m) => m.id);
        const response = await groupService.createGroup(
          groupName.trim(),
          memberIds,
          currency,
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showAlert({
          type: "success",
          title: "Group Created! 🎉",
          message:
            selectedMembers.length > 0
              ? `"${groupName}" is ready. Invitations have been sent to your friends.`
              : `"${groupName}" is ready. Share the invite link with friends.`,
          buttons: [
            {
              text: "Share Invite",
              onPress: () =>
                Share.share({
                  message: `Join "${groupName}" on SplitMate!\n\n${response.inviteLink}`,
                }),
            },
            {
              text: "Done",
              style: "cancel",
              onPress: () => navigation.goBack(),
            },
          ],
        });
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert({
        type: "error",
        title: "Error",
        message:
          error.response?.data?.message ||
          `Failed to ${isEditing ? "update" : "create"} group`,
      });
    } finally {
      setLoading(false);
    }
  };

  // Determine active icon / letter preview for premium interactivity
  const renderGroupIcon = () => {
    const trimmed = groupName.trim();
    if (trimmed.length > 0) {
      return (
        <Text style={styles.iconLetter}>
          {trimmed.charAt(0).toUpperCase()}
        </Text>
      );
    }
    return (
      <Ionicons
        name={isEditing ? "create" : "people"}
        size={34}
        color="#FFF"
      />
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
    >
      <StatusBar barStyle="dark-content" />
      <CustomAlert {...alertProps} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        <AnimatedView entering={FadeInDown.duration(400).delay(50)}>
          <View style={styles.heroSection}>
            <LinearGradient
              colors={[COLORS.gradientStart, COLORS.gradientEnd]}
              style={[styles.iconCircle, SHADOWS.medium]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {renderGroupIcon()}
            </LinearGradient>
            <Text style={styles.heroTitle}>
              {isEditing ? "Edit Group" : "Create Group"}
            </Text>
            <Text style={styles.heroSubtitle}>
              {isEditing
                ? "Update your group details below"
                : "Start a shared space to split expenses with friends"}
            </Text>
          </View>
        </AnimatedView>

        {/* Input Card */}
        <AnimatedView
          entering={FadeInDown.duration(400).delay(120)}
          style={[styles.card, SHADOWS.soft]}
        >
          <View style={styles.inputHeader}>
            <Text style={styles.inputLabel}>Group Name</Text>
            <Text style={styles.charCount}>{groupName.length}/50</Text>
          </View>

          <View
            style={[
              styles.inputWrap,
              focused && styles.inputWrapFocused,
            ]}
          >
            <Ionicons
              name="people-outline"
              size={20}
              color={focused ? COLORS.primary : COLORS.gray}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="e.g. Goa Trip, Flat Mates, Dinner..."
              placeholderTextColor="#9CA3AF"
              value={groupName}
              onChangeText={setGroupName}
              editable={!loading}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              maxLength={50}
            />
            {groupName.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setGroupName("");
                }}
                style={styles.clearBtn}
              >
                <Ionicons name="close-circle" size={18} color={COLORS.gray} />
              </TouchableOpacity>
            )}
          </View>
        </AnimatedView>

        {/* Currency Card */}
        <AnimatedView
          entering={FadeInDown.duration(400).delay(150)}
          style={[styles.card, SHADOWS.soft, { zIndex: 10 }]}
        >
          <Text style={styles.inputLabel}>Group Currency</Text>
          
          <TouchableOpacity
            style={[
              styles.inputWrap,
              currencyDropdownOpen && styles.inputWrapFocused,
              { marginTop: 8, justifyContent: "space-between", paddingVertical: 12 }
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setCurrencyDropdownOpen(!currencyDropdownOpen);
            }}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={[styles.currencyIconBadge, { backgroundColor: COLORS.primary + "15" }]}>
                <Text style={styles.currencySymbolPreview}>
                  {SUPPORTED_CURRENCIES.find(c => c.code === currency)?.symbol || "₹"}
                </Text>
              </View>
              <Text style={styles.selectedCurrencyLabel}>
                {SUPPORTED_CURRENCIES.find(c => c.code === currency)?.label || "Indian Rupee (₹)"}
              </Text>
            </View>
            <Ionicons
              name={currencyDropdownOpen ? "chevron-up" : "chevron-down"}
              size={20}
              color={COLORS.gray}
            />
          </TouchableOpacity>

          {currencyDropdownOpen && (
            <AnimatedView entering={FadeInDown.duration(200)} style={styles.currencyList}>
              {SUPPORTED_CURRENCIES.map((item) => {
                const isSelected = item.code === currency;
                return (
                  <TouchableOpacity
                    key={item.code}
                    style={[
                      styles.currencyItem,
                      isSelected && styles.currencyItemActive
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setCurrency(item.code);
                      setCurrencyDropdownOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <Text style={[styles.currencyItemSymbol, isSelected && { color: COLORS.primary }]}>
                        {item.symbol}
                      </Text>
                      <Text style={[styles.currencyItemLabel, isSelected && { color: COLORS.primary, fontWeight: "750" }]}>
                        {item.label}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </AnimatedView>
          )}
        </AnimatedView>

        {/* Members Card */}
        {!isEditing && (
          <AnimatedView
            entering={FadeInDown.duration(400).delay(180)}
            style={[styles.card, SHADOWS.soft]}
          >
            <Text style={styles.inputLabel}>Add Members (Optional)</Text>
            <View style={styles.searchWrap}>
              <Ionicons
                name="search-outline"
                size={18}
                color={COLORS.gray}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search friend by email..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={handleSearch}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              {searching && (
                <ActivityIndicator
                  size="small"
                  color={COLORS.primary}
                  style={{ marginRight: 12 }}
                />
              )}
            </View>

            {searchResults.length > 0 && (
              <View style={styles.resultsList}>
                {searchResults.map((user) => {
                  const isAlreadySelected = selectedMembers.some((m) => m.id === user.id);
                  return (
                    <TouchableOpacity
                      key={user.id}
                      style={styles.resultItem}
                      onPress={() => toggleMember(user)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.resultAvatar}>
                        <Text style={styles.resultAvatarText}>
                          {user.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.resultName}>{user.name}</Text>
                        <Text style={styles.resultEmail}>{user.email}</Text>
                      </View>
                      <Ionicons
                        name={isAlreadySelected ? "checkmark-circle" : "add-circle-outline"}
                        size={24}
                        color={isAlreadySelected ? COLORS.success : COLORS.primary}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Premium iMessage/WhatsApp Style Selected Members Avatar List */}
            {selectedMembers.length > 0 && (
              <View style={styles.selectedContainer}>
                <Text style={styles.selectedTitle}>
                  Added Members ({selectedMembers.length})
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.selectedAvatarScroll}
                >
                  {selectedMembers.map((member) => (
                    <AnimatedView
                      entering={ZoomIn.duration(300)}
                      key={member.id}
                      style={styles.selectedUserCard}
                    >
                      <View style={[styles.squircleAvatar, SHADOWS.soft]}>
                        <LinearGradient
                          colors={[COLORS.primary + "15", COLORS.secondary + "15"]}
                          style={styles.squircleGradient}
                        >
                          <Text style={styles.squircleAvatarText}>
                            {member.name.charAt(0).toUpperCase()}
                          </Text>
                        </LinearGradient>
                        <TouchableOpacity
                          style={styles.removeBadge}
                          onPress={() => toggleMember(member)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="close" size={10} color="#FFF" />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.selectedUserName} numberOfLines={1}>
                        {member.name.split(" ")[0]}
                      </Text>
                    </AnimatedView>
                  ))}
                </ScrollView>
              </View>
            )}
          </AnimatedView>
        )}

        {/* Action Button */}
        <AnimatedView entering={FadeInUp.duration(400).delay(250)}>
          <TouchableOpacity
            style={[styles.btnWrapper, loading && { opacity: 0.7 }]}
            onPress={handleAction}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[COLORS.gradientStart, COLORS.gradientEnd]}
              style={styles.btn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={styles.btnText}>
                    {isEditing ? "Save Changes" : "Create Group"}
                  </Text>
                  <Ionicons
                    name={isEditing ? "checkmark-circle" : "arrow-forward"}
                    size={20}
                    color="#FFF"
                    style={{ marginLeft: 8 }}
                  />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </AnimatedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8F9FD" },
  scroll: { padding: 20, flexGrow: 1 },

  heroSection: { alignItems: "center", marginBottom: 24, marginTop: 4 },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  iconLetter: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFF",
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.dark,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    color: COLORS.gray,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 16,
  },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EBEBF2",
  },
  inputHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.dark,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#F0F0F5",
    borderRadius: 14,
    backgroundColor: "#FAFAFD",
    paddingHorizontal: 12,
  },
  inputWrapFocused: {
    borderColor: COLORS.primary,
    backgroundColor: "#FFF",
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.dark,
    paddingVertical: 14,
    fontWeight: "500",
  },
  clearBtn: {
    padding: 4,
  },
  charCount: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: "600",
  },

  btnWrapper: { borderRadius: 16, overflow: "hidden" },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  btnText: { color: "#FFF", fontSize: 16, fontWeight: "850" },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#F0F0F5",
    borderRadius: 14,
    backgroundColor: "#FAFAFD",
    paddingLeft: 12,
    marginTop: 8,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.dark,
    paddingVertical: 10,
    fontWeight: "500",
  },
  resultsList: {
    backgroundColor: "#F9FAFC",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#EBEBF2",
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#EBEBF2",
  },
  resultAvatar: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: COLORS.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  resultAvatarText: { color: COLORS.primary, fontWeight: "bold", fontSize: 14 },
  resultName: { fontSize: 13, fontWeight: "700", color: COLORS.dark },
  resultEmail: { fontSize: 11, color: COLORS.gray, marginTop: 1 },

  selectedContainer: { marginTop: 16 },
  selectedTitle: {
    fontSize: 11,
    fontWeight: "750",
    color: COLORS.dark,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  selectedAvatarScroll: { paddingVertical: 4 },
  selectedUserCard: {
    alignItems: "center",
    marginRight: 16,
    width: 58,
  },
  squircleAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    position: "relative",
    backgroundColor: "#FFF",
  },
  squircleGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.primary + "30",
  },
  squircleAvatarText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 16,
  },
  removeBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.danger,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFF",
  },
  selectedUserName: {
    fontSize: 10,
    color: COLORS.dark,
    fontWeight: "600",
    marginTop: 6,
    textAlign: "center",
    width: "100%",
  },
  currencyIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  currencySymbolPreview: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary,
  },
  selectedCurrencyLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.dark,
  },
  currencyList: {
    marginTop: 10,
    backgroundColor: "#F9FAFC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EBEBF2",
    overflow: "hidden",
  },
  currencyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#EBEBF2",
  },
  currencyItemActive: {
    backgroundColor: COLORS.primary + "08",
  },
  currencyItemSymbol: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.gray,
    width: 20,
    textAlign: "center",
  },
  currencyItemLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.dark,
  },
});
