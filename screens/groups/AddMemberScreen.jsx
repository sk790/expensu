import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Image,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import * as Clipboard from "expo-clipboard";
import { userService, groupInvitationService, groupService } from "../../services/authService";
import { COLORS } from "../../utils/constants";
import Animated, { FadeInUp, Layout, ZoomIn } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import CustomAlert from "../../components/CustomAlert";
import { useAlert } from "../../hooks/useAlert";
import { storage } from "../../utils/storage";

export default function AddMemberScreen({ route, navigation }) {
  const { groupId, currentMembers, isAdmin } = route.params;
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState("search"); // "search" or "inviteCode"
  const [email, setEmail] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [invitationStatus, setInvitationStatus] = useState(null);
  const [cancellingInvite, setCancellingInvite] = useState(false);
  const [recentMembers, setRecentMembers] = useState([]);
  const { alertProps, showAlert } = useAlert();

  // Invite Code State
  const [groupDetails, setGroupDetails] = useState(null);
  const [inviteCode, setInviteCode] = useState("");
  const [loadingGroup, setLoadingGroup] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadRecentMembers();
    if (isAdmin) {
      fetchGroupDetails();
    }
  }, [groupId]);

  const loadRecentMembers = async () => {
    try {
      const list = await storage.getRecentMembers();
      setRecentMembers(list || []);
    } catch (error) {
      console.error("Failed to load recent members:", error);
    }
  };

  const fetchGroupDetails = async () => {
    try {
      setLoadingGroup(true);
      const response = await groupService.getGroup(groupId);
      setGroupDetails(response.data);
      setInviteCode(response.data.inviteCode);
    } catch (error) {
      console.error("Failed to load group details:", error);
    } finally {
      setLoadingGroup(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (email.trim().length >= 3) {
        performSearch();
      } else {
        setSearchResults(null);
        setInvitationStatus(null);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [email]);

  const performSearch = async () => {
    setSearching(true);
    try {
      const response = await userService.searchUserByEmail(email.trim(), groupId);
      const isAlreadyMember = currentMembers.some(
        (member) => (member._id || member.id) === response.user.id
      );
      if (isAlreadyMember) {
        setSearchResults(null);
        setInvitationStatus(null);
        return;
      }
      setSearchResults(response.user);
      setInvitationStatus(response.invitationStatus);
    } catch (error) {
      setSearchResults(null);
      setInvitationStatus(null);
    } finally {
      setSearching(false);
    }
  };

  const handleSendInvite = async () => {
    if (!searchResults) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      await groupInvitationService.sendInvitation(groupId, searchResults.id);

      try {
        const updatedList = await storage.addRecentMember(searchResults);
        setRecentMembers(updatedList);
      } catch (storageError) {
        console.error("Failed to save recent member:", storageError);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Update local state to show cancel button — no popup
      setInvitationStatus("pending");
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert({
        type: "error",
        title: "Oops",
        message: error.response?.data?.message || "Failed to send invitation.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvitation = async () => {
    if (!searchResults) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCancellingInvite(true);
    try {
      await groupInvitationService.cancelInvitation(groupId, searchResults.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setInvitationStatus(null);
      showAlert({
        type: "success",
        title: "Invitation Cancelled",
        message: `Invitation to ${searchResults.name} has been cancelled.`,
      });
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert({
        type: "error",
        title: "Error",
        message: error.response?.data?.message || "Failed to cancel invitation.",
      });
    } finally {
      setCancellingInvite(false);
    }
  };

  const handleCopyCode = async () => {
    if (!inviteCode) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(inviteCode);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleShareLink = async () => {
    if (!inviteCode) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const inviteUrl = `splitmate://join/${inviteCode}`;
    try {
      await Share.share({
        message: `Join our expense sharing group on SplitMate! Code: ${inviteCode}\nOr click the link: ${inviteUrl}`,
        title: "Join SplitMate Group",
      });
    } catch (error) {
      console.error("Failed to share link:", error);
    }
  };

  const handleRegenerateCode = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showAlert({
      type: "confirm",
      title: "Regenerate Invite Code?",
      message: "This will invalidate the existing invite code and QR code. Anyone trying to join with the old code won't be able to.",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Regenerate",
          style: "destructive",
          onPress: async () => {
            setRegenerating(true);
            try {
              const response = await groupService.regenerateInviteCode(groupId);
              setInviteCode(response.data.inviteCode);
              setGroupDetails(response.data);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              showAlert({
                type: "success",
                title: "Code Regenerated! 🔄",
                message: `New code is ${response.data.inviteCode}`,
              });
            } catch (error) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              showAlert({
                type: "error",
                title: "Failed to Regenerate",
                message: error.response?.data?.message || "Something went wrong.",
              });
            } finally {
              setRegenerating(false);
            }
          },
        },
      ],
    });
  };

  if (isAdmin === false) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center", padding: 24 }]}>
        <StatusBar barStyle="dark-content" />
        <View style={[styles.iconContainer, { backgroundColor: COLORS.primary + "12" }]}>
          <Ionicons name="lock-closed-outline" size={32} color={COLORS.primary} />
        </View>
        <Text style={[styles.title, { marginTop: 12, textAlign: "center" }]}>Admin Access Required</Text>
        <Text style={[styles.subtitle, { textAlign: "center", marginTop: 12, paddingHorizontal: 20 }]}>
          Only the group admin (creator) can invite or add new members to this group.
        </Text>
        <TouchableOpacity
          style={[styles.inviteButton, { marginTop: 32, width: 200 }]}
          onPress={() => navigation.goBack()}
        >
          <LinearGradient
            colors={[COLORS.primary, "#6366f1"]}
            style={styles.inviteGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.inviteText}>Go Back</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <CustomAlert {...alertProps} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : null}
      >
        {/* Main Header */}
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <View style={styles.iconContainer}>
            <Ionicons name="person-add" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Add Member</Text>
          <Text style={styles.subtitle}>Bring more friends into the group</Text>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "search" && styles.activeTab]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab("search");
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="search-outline"
              size={18}
              color={activeTab === "search" ? COLORS.white : COLORS.gray}
            />
            <Text style={[styles.tabText, activeTab === "search" && styles.activeTabText]}>
              Search User
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "inviteCode" && styles.activeTab]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab("inviteCode");
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="qr-code-outline"
              size={18}
              color={activeTab === "inviteCode" ? COLORS.white : COLORS.gray}
            />
            <Text style={[styles.tabText, activeTab === "inviteCode" && styles.activeTabText]}>
              QR & Code
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="always"
        >
          {/* TAB 1: SEARCH & INVITE */}
          {activeTab === "search" && (
            <Animated.View entering={FadeInUp.duration(400)} style={styles.tabView}>
              {/* Search Box - High Stability */}
              <View style={styles.searchBox}>
                <Ionicons name="search-outline" size={20} color={COLORS.gray} />
                <TextInput
                  key="member-search-input-stable"
                  style={styles.input}
                  placeholder="Email or username..."
                  placeholderTextColor={COLORS.gray + "80"}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  spellCheck={false}
                  editable={true}
                />
                <View style={{ width: 30, alignItems: "center", justifyContent: "center" }}>
                  {searching ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : email.length > 0 ? (
                    <TouchableOpacity onPress={() => setEmail("")} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Ionicons name="close-circle" size={20} color={COLORS.gray} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              {/* Results Area */}
              <View style={styles.resultsArea}>
                {searchResults ? (
                  <Animated.View entering={ZoomIn.duration(400)} layout={Layout.springify()} style={styles.userCard}>
                    <View style={styles.cardHeader}>
                      <View style={styles.squircleAvatar}>
                        {searchResults.avatar ? (
                          <Image source={{ uri: searchResults.avatar }} style={styles.resultAvatarImage} />
                        ) : (
                          <Text style={styles.avatarText}>{searchResults.name.substring(0, 1).toUpperCase()}</Text>
                        )}
                      </View>
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{searchResults.name}</Text>
                        <Text style={styles.userHandle}>@{searchResults.username || "user"}</Text>
                      </View>
                      <View style={styles.badge}>
                        <Ionicons name="shield-checkmark" size={16} color={COLORS.primary} />
                      </View>
                    </View>

                    <View style={styles.cardDivider} />

                    <View style={styles.emailRow}>
                      <Ionicons name="mail-outline" size={16} color={COLORS.gray} />
                      <Text style={styles.emailText}>{searchResults.email}</Text>
                    </View>

                    <View style={styles.actionRow}>
                      {invitationStatus === "pending" ? (
                        <TouchableOpacity
                          style={styles.cancelInviteButton}
                          onPress={handleCancelInvitation}
                          disabled={cancellingInvite}
                          activeOpacity={0.85}
                        >
                          {cancellingInvite ? (
                            <ActivityIndicator size="small" color="#FFF" />
                          ) : (
                            <>
                              <Ionicons name="close-circle-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                              <Text style={styles.cancelInviteText}>Cancel Invitation</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.inviteButton}
                          onPress={handleSendInvite}
                          disabled={loading}
                        >
                          <LinearGradient
                            colors={[COLORS.primary, "#6366f1"]}
                            style={styles.inviteGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                          >
                            {loading ? (
                              <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                              <>
                                <Text style={styles.inviteText}>Send Invitation</Text>
                                <Ionicons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 8 }} />
                              </>
                            )}
                          </LinearGradient>
                        </TouchableOpacity>
                      )}
                    </View>
                  </Animated.View>
                ) : email.length === 0 && recentMembers.length > 0 ? (
                  <Animated.View entering={FadeInUp.duration(400)} style={styles.recentSection}>
                    <Text style={styles.recentTitle}>Recent Invites</Text>
                    <View style={styles.recentCard}>
                      {recentMembers.slice(0, 5).map((member, index, arr) => (
                        <View key={member.id || member._id || index}>
                          <TouchableOpacity
                            style={styles.recentRow}
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              setEmail(member.email || member.username);
                            }}
                            activeOpacity={0.7}
                          >
                            <View style={styles.recentAvatar}>
                              {member.avatar ? (
                                <Image source={{ uri: member.avatar }} style={styles.recentAvatarImage} />
                              ) : (
                                <Text style={styles.recentAvatarText}>
                                  {member.name ? member.name.charAt(0).toUpperCase() : "U"}
                                </Text>
                              )}
                            </View>
                            <View style={styles.recentInfo}>
                              <Text style={styles.recentName}>{member.name}</Text>
                              <Text style={styles.recentHandle}>@{member.username || "user"}</Text>
                            </View>
                            <Ionicons name="arrow-forward" size={18} color={COLORS.gray + "80"} />
                          </TouchableOpacity>
                          {index < arr.length - 1 && <View style={styles.recentDivider} />}
                        </View>
                      ))}
                    </View>
                  </Animated.View>
                ) : (
                  <Animated.View entering={FadeInUp.delay(400)} style={styles.emptyContainer}>
                    <View style={styles.emptyIconBox}>
                      <Ionicons
                        name={email.length >= 3 ? "person-outline" : "search-outline"}
                        size={40}
                        color={COLORS.gray + "40"}
                      />
                    </View>
                    <Text style={styles.emptyTitle}>
                      {email.length >= 3 ? "Searching for results..." : "Start searching"}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                      {email.length >= 3
                        ? "Looking through our records..."
                        : "Enter a friend's email or username to find them."}
                    </Text>
                  </Animated.View>
                )}
              </View>
            </Animated.View>
          )}

          {/* TAB 2: QR & CODE */}
          {activeTab === "inviteCode" && (
            <Animated.View entering={FadeInUp.duration(400)} style={styles.tabView}>
              {loadingGroup ? (
                <View style={styles.loadingGroupContainer}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={styles.loadingText}>Fetching invite details...</Text>
                </View>
              ) : (
                <Animated.View entering={ZoomIn.duration(400)} style={styles.qrCard}>
                  <Text style={styles.qrTitle}>Join Group instantly</Text>
                  <Text style={styles.qrDesc}>
                    Share this QR Code or the short-code below with your friends so they can join instantly.
                  </Text>

                  {/* Generated QR SVG */}
                  <View style={styles.qrContainer}>
                    {inviteCode ? (
                      <QRCode
                        value={`splitmate://join/${inviteCode}`}
                        size={180}
                        color={COLORS.primary}
                        backgroundColor={COLORS.white}
                        logo={require("../../assets/images/icon.png")}
                        logoSize={36}
                        logoBorderRadius={8}
                        logoBackgroundColor="white"
                      />
                    ) : (
                      <ActivityIndicator size="medium" color={COLORS.primary} />
                    )}
                  </View>

                  {/* 6-Letter Code Container */}
                  <View style={styles.codeTextContainer}>
                    <Text style={styles.codeLabel}>INVITE CODE</Text>
                    <View style={styles.codeRow}>
                      <Text style={styles.codeDisplay}>{inviteCode || "------"}</Text>
                      <TouchableOpacity
                        style={[styles.copyBtn, copied && styles.copyBtnCopied]}
                        onPress={handleCopyCode}
                        activeOpacity={0.7}
                      >
                        {copied ? (
                          <Animated.View entering={ZoomIn.duration(300)} key="check-icon" style={styles.copyBtnContent}>
                            <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                            <Text style={styles.copiedText}>Copied</Text>
                          </Animated.View>
                        ) : (
                          <Animated.View entering={ZoomIn.duration(300)} key="copy-icon" style={styles.copyBtnContent}>
                            <Ionicons name="copy-outline" size={14} color={COLORS.primary} />
                            <Text style={styles.copyText}>Copy</Text>
                          </Animated.View>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Share actions */}
                  <View style={styles.shareButtonsRow}>
                    <TouchableOpacity
                      style={styles.shareActionBtn}
                      onPress={handleShareLink}
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

                    <TouchableOpacity
                      style={[styles.regenerateBtn, regenerating && styles.btnDisabled]}
                      onPress={handleRegenerateCode}
                      disabled={regenerating}
                      activeOpacity={0.8}
                    >
                      {regenerating ? (
                        <ActivityIndicator size="small" color={COLORS.danger} />
                      ) : (
                        <>
                          <Ionicons name="refresh-outline" size={20} color={COLORS.danger} style={{ marginRight: 4 }} />
                          <Text style={styles.regenerateText}>Regenerate</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              )}
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  scrollContent: {
    padding: 24,
    paddingTop: 8,
    paddingBottom: 40,
  },
  tabView: {
    width: "100%",
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: COLORS.primary + "12",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.dark,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4,
    fontWeight: "500",
  },

  // Tab Styles
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: 16,
    padding: 4,
    marginHorizontal: 24,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gray,
  },
  activeTabText: {
    color: COLORS.white,
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 58,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.dark,
    marginLeft: 10,
  },
  resultsArea: {
    marginTop: 20,
  },
  userCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  squircleAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "800",
  },
  userInfo: {
    flex: 1,
    marginLeft: 14,
  },
  userName: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.dark,
  },
  userHandle: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "600",
    marginTop: 2,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary + "08",
    alignItems: "center",
    justifyContent: "center",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 16,
  },
  emailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  emailText: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: "500",
    marginLeft: 8,
  },
  actionRow: {
    width: "100%",
  },
  inviteButton: {
    width: "100%",
    height: 52,
    borderRadius: 16,
    overflow: "hidden",
  },
  inviteGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  inviteText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },
  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF9F0",
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#FFE5BC",
  },
  pendingText: {
    color: "#FF9500",
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 8,
  },
  resultAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 16,
  },
  recentSection: {
    marginTop: 8,
  },
  recentTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.dark,
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  recentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  recentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  recentAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 14,
  },
  recentAvatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
  },
  recentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  recentName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.dark,
  },
  recentHandle: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: "500",
    marginTop: 2,
  },
  recentDivider: {
    height: 1,
    backgroundColor: "#F2F4F7",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 30,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.dark,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: "center",
    marginTop: 6,
    paddingHorizontal: 32,
    lineHeight: 20,
  },

  // QR invite code styles
  loadingGroupContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 12,
    fontWeight: "500",
  },
  qrCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.dark,
    marginBottom: 6,
  },
  qrDesc: {
    fontSize: 13,
    color: COLORS.gray,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  qrContainer: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  codeTextContainer: {
    width: "100%",
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.gray,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  codeDisplay: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: 2,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary + "0A",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary + "1A",
    marginLeft: 10,
  },
  copyBtnCopied: {
    backgroundColor: "#10B9810A",
    borderColor: "#10B9812A",
  },
  copyBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  copyText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },
  copiedText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#10B981",
  },
  shareButtonsRow: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  shareActionBtn: {
    flex: 1.6,
    height: 52,
    borderRadius: 16,
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
    fontWeight: "700",
  },
  regenerateBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
    backgroundColor: "#FEF2F2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  btnDisabled: {
    opacity: 0.5,
  },
  regenerateText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: "700",
  },
  cancelInviteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.danger,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  cancelInviteText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
