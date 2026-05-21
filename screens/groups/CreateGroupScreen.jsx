import React, { useState } from "react";
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
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";
import * as Clipboard from "expo-clipboard";
import { groupService } from "../../services/authService";
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
  const { alertProps, showAlert } = useAlert();
  const [activeTab, setActiveTab] = useState("members"); // "members" or "qrCode"
  const [copied, setCopied] = useState(false);
  const [members, setMembers] = useState(groupToEdit?.members || []);

  const handleCopyCode = async () => {
    const inviteCode = groupToEdit?.inviteCode;
    if (!inviteCode) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(inviteCode);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleShareInvite = () => {
    const inviteCode = groupToEdit?.inviteCode;
    if (!inviteCode) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Share.share({
      message: `Join my group "${groupName}" on SplitMate! Use the invite code: ${inviteCode} to join instantly!`,
    });
  };

  const handleRemoveMember = (member) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showAlert({
      type: "confirm",
      title: "Remove Member",
      message: `Are you sure you want to remove ${member.name} from "${groupName}"?`,
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setLoading(true);
            try {
              await groupService.removeMember(groupToEdit._id, member._id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              
              const updatedMembers = members.filter((m) => (m._id || m.id) !== (member._id || member.id));
              setMembers(updatedMembers);
              
              if (route.params?.group) {
                route.params.group.members = updatedMembers;
              }

              showAlert({
                type: "success",
                title: "Member Removed ✨",
                message: `${member.name} has been removed successfully from "${groupName}".`,
              });
            } catch (error) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              showAlert({
                type: "error",
                title: "Error",
                message: error.response?.data?.message || "Failed to remove member",
              });
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    });
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
        const response = await groupService.createGroup(
          groupName.trim(),
          [],
          currency,
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showAlert({
          type: "success",
          title: "Group Created! 🎉",
          message: `"${groupName}" is ready. Share the invite link with friends.`,
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

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
    >
      <StatusBar barStyle="dark-content" />
      <CustomAlert {...alertProps} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
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

        {/* Members & QR Card */}
        <AnimatedView
          entering={FadeInDown.duration(400).delay(180)}
          style={[styles.card, SHADOWS.soft]}
        >
          {isEditing ? (
            <>
              <Text style={styles.inputLabel}>Group Members & Invite</Text>

              {/* Elegant Tabs Selector */}
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[styles.tab, activeTab === "members" && styles.activeTab]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveTab("members");
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="people-outline"
                    size={18}
                    color={activeTab === "members" ? COLORS.white : COLORS.gray}
                  />
                  <Text style={[styles.tabText, activeTab === "members" && styles.activeTabText]}>
                    Members
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tab, activeTab === "qrCode" && styles.activeTab]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveTab("qrCode");
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="qr-code-outline"
                    size={18}
                    color={activeTab === "qrCode" ? COLORS.white : COLORS.gray}
                  />
                  <Text style={[styles.tabText, activeTab === "qrCode" && styles.activeTabText]}>
                    QR & Code
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Tab 1 Content: Members */}
              {activeTab === "members" && (
                <AnimatedView entering={FadeInUp.duration(300)}>
                  <View style={styles.currentMembersContainer}>
                    {members && members.length > 0 ? (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.selectedAvatarScroll}
                      >
                        {members.map((member) => {
                          const isCreator = member._id === (groupToEdit?.createdBy?._id || groupToEdit?.createdBy);
                          return (
                            <View key={member._id || member.id} style={styles.selectedUserCard}>
                              <View style={[styles.squircleAvatar, SHADOWS.soft]}>
                                <LinearGradient
                                  colors={[COLORS.primary + "15", COLORS.secondary + "15"]}
                                  style={styles.squircleGradient}
                                >
                                  {member.avatar ? (
                                    <Image source={{ uri: member.avatar }} style={styles.squircleAvatarImage} />
                                  ) : (
                                    <Text style={styles.squircleAvatarText}>
                                      {member.name.charAt(0).toUpperCase()}
                                    </Text>
                                  )}
                                </LinearGradient>

                                {!isCreator && (
                                  <TouchableOpacity
                                    style={styles.removeBadge}
                                    onPress={() => handleRemoveMember(member)}
                                    activeOpacity={0.7}
                                  >
                                    <Ionicons name="close" size={10} color="#FFF" />
                                  </TouchableOpacity>
                                )}
                              </View>
                              <Text style={styles.selectedUserName} numberOfLines={1}>
                                {member.name.split(" ")[0]}
                              </Text>
                            </View>
                          );
                        })}
                      </ScrollView>
                    ) : (
                      <Text style={styles.noMembersText}>No members in this group yet.</Text>
                    )}
                  </View>
                </AnimatedView>
              )}

              {/* Tab 2 Content: QR & Code */}
              {activeTab === "qrCode" && (
                <AnimatedView entering={FadeInUp.duration(300)} style={styles.qrTabView}>
                  <View style={styles.qrCard}>
                    <Text style={styles.qrTitle}>Join Group Instantly</Text>
                    <Text style={styles.qrDesc}>
                      Share this QR Code or the invite code with your friends to let them join instantly.
                    </Text>

                    {/* Live Generated QR Code */}
                    <View style={styles.qrContainer}>
                      {groupToEdit?.inviteCode ? (
                        <QRCode
                          value={`splitmate://join/${groupToEdit.inviteCode}`}
                          size={160}
                          color={COLORS.primary}
                          backgroundColor={COLORS.white}
                          logo={require("../../assets/images/icon.png")}
                          logoSize={32}
                          logoBorderRadius={6}
                          logoBackgroundColor="white"
                        />
                      ) : (
                        <ActivityIndicator size="medium" color={COLORS.primary} />
                      )}
                    </View>

                    {/* Invite Code Row */}
                    <View style={styles.codeTextContainer}>
                      <Text style={styles.codeLabel}>INVITE CODE</Text>
                      <View style={styles.codeRow}>
                        <Text style={styles.codeDisplay}>{groupToEdit?.inviteCode || "------"}</Text>
                        <TouchableOpacity
                          style={[styles.copyBtn, copied && styles.copyBtnCopied]}
                          onPress={handleCopyCode}
                          activeOpacity={0.7}
                        >
                          {copied ? (
                            <AnimatedView entering={ZoomIn.duration(300)} key="check-icon" style={styles.copyBtnContent}>
                              <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                              <Text style={styles.copiedText}>Copied</Text>
                            </AnimatedView>
                          ) : (
                            <AnimatedView entering={ZoomIn.duration(300)} key="copy-icon" style={styles.copyBtnContent}>
                              <Ionicons name="copy-outline" size={14} color={COLORS.primary} />
                              <Text style={styles.copyText}>Copy</Text>
                            </AnimatedView>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Share button */}
                    <TouchableOpacity
                      style={styles.shareActionBtn}
                      onPress={handleShareInvite}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={[COLORS.primary, "#6366f1"]}
                        style={styles.shareGrad}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Ionicons name="share-social-outline" size={20} color="#FFF" style={{ marginRight: 6 }} />
                        <Text style={styles.shareText}>Share Invite Link</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </AnimatedView>
              )}
            </>
          ) : (
            /* Creation Mode: Direct Locked Preview */
            <>
              <Text style={styles.inputLabel}>Invite Friends Instantly</Text>
              <AnimatedView entering={FadeInUp.duration(300)} style={[styles.qrTabView, { marginTop: 12 }]}>
                <View style={styles.qrCard}>
                  <Text style={styles.qrTitle}>Join Group Instantly</Text>
                  <Text style={styles.qrDesc}>
                    Once your group is created, a unique QR Code and Invite Link will be generated instantly.
                  </Text>

                  {/* Locked/Mock QR Container */}
                  <View style={styles.qrPlaceholderContainer}>
                    <View style={[styles.qrContainer, { opacity: 0.25 }]}>
                      <QRCode
                        value="splitmate://preview"
                        size={150}
                        color="#9CA3AF"
                        backgroundColor={COLORS.white}
                      />
                    </View>
                    <View style={[styles.qrLockOverlay, SHADOWS.medium]}>
                      <Ionicons name="lock-closed" size={24} color="#FFF" />
                    </View>
                  </View>

                  <View style={styles.codeTextContainer}>
                    <Text style={styles.codeLabel}>INVITE CODE</Text>
                    <View style={[styles.codeRow, { justifyContent: "center" }]}>
                      <Text style={[styles.codeDisplay, { color: COLORS.gray + "60", letterSpacing: 4 }]}>
                        XXXXXX
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.qrInfoText}>
                    ✨ Ready to be shared after creation!
                  </Text>
                </View>
              </AnimatedView>
            </>
          )}
        </AnimatedView>

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

  // Tab selector styles inside members card
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#F0F0F5",
    borderRadius: 12,
    padding: 3,
    marginTop: 12,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 9,
    gap: 6,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.gray,
  },
  activeTabText: {
    color: COLORS.white,
    fontWeight: "700",
  },

  // QR Content Styles
  qrTabView: {
    width: "100%",
    marginTop: 4,
  },
  qrCard: {
    backgroundColor: "#FAFAFD",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EBEBF2",
  },
  qrTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.dark,
    marginBottom: 4,
  },
  qrDesc: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 16,
    paddingHorizontal: 12,
  },
  qrContainer: {
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EBEBF2",
    marginBottom: 16,
  },
  qrPlaceholderContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  qrLockOverlay: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  qrInfoText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.primary,
    marginTop: 4,
  },

  // Invite code container and items
  codeTextContainer: {
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#EBEBF2",
    marginBottom: 16,
  },
  codeLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.gray,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  codeDisplay: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.dark,
    letterSpacing: 1.5,
  },
  copyBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: COLORS.primary + "10",
    borderWidth: 1,
    borderColor: COLORS.primary + "20",
  },
  copyBtnCopied: {
    backgroundColor: "#10B98110",
    borderColor: "#10B98130",
  },
  copyBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  copyText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
  },
  copiedText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#10B981",
  },

  // Share invite button
  shareActionBtn: {
    width: "100%",
    height: 48,
    borderRadius: 12,
    overflow: "hidden",
  },
  shareGrad: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  shareText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "750",
  },

  // Current Members styling
  currentMembersContainer: {
    marginTop: 4,
  },
  noMembersText: {
    fontSize: 13,
    color: COLORS.gray,
    textAlign: "center",
    marginVertical: 20,
    fontStyle: "italic",
  },
  squircleAvatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },
  removeBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.danger,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFF",
    zIndex: 10,
  },
});
