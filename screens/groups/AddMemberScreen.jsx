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
import { userService, groupInvitationService, groupService, friendService } from "../../services/authService";
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

  const [activeTab, setActiveTab] = useState("friends"); // "friends", "search", or "inviteCode"
  const [email, setEmail] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [isSearchUserFriend, setIsSearchUserFriend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [invitationStatus, setInvitationStatus] = useState(null);
  const [cancellingInvite, setCancellingInvite] = useState(false);
  const [recentMembers, setRecentMembers] = useState([]);
  const { alertProps, showAlert } = useAlert();

  // Friends Tab State
  const [friendsList, setFriendsList] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [friendFilter, setFriendFilter] = useState("");
  const [addedMemberIds, setAddedMemberIds] = useState(
    (currentMembers || []).map((m) => (m._id || m.id).toString())
  );
  const [addingFriendId, setAddingFriendId] = useState(null);

  // Invite Code State
  const [groupDetails, setGroupDetails] = useState(null);
  const [inviteCode, setInviteCode] = useState("");
  const [loadingGroup, setLoadingGroup] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadRecentMembers();
    fetchFriends();
    if (isAdmin) {
      fetchGroupDetails();
    }
  }, [groupId]);

  const fetchFriends = async () => {
    try {
      setLoadingFriends(true);
      const response = await friendService.getFriends();
      setFriendsList(response.friends || []);
    } catch (error) {
      console.error("Failed to load friends:", error);
    } finally {
      setLoadingFriends(false);
    }
  };

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
        setIsSearchUserFriend(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [email]);

  const performSearch = async () => {
    setSearching(true);
    try {
      const response = await userService.searchUserByEmail(email.trim(), groupId);
      const isAlreadyMember = addedMemberIds.includes(response.user.id.toString());
      if (isAlreadyMember) {
        setSearchResults(null);
        setInvitationStatus(null);
        setIsSearchUserFriend(false);
        return;
      }
      setSearchResults(response.user);
      setInvitationStatus(response.invitationStatus);
      
      const isFriend =
        response.isFriend ||
        friendsList.some((f) => (f._id || f.id).toString() === response.user.id.toString());
      setIsSearchUserFriend(isFriend);
    } catch (error) {
      setSearchResults(null);
      setInvitationStatus(null);
      setIsSearchUserFriend(false);
    } finally {
      setSearching(false);
    }
  };

  const handleAddFriendDirectly = async (friendUser) => {
    const friendId = (friendUser._id || friendUser.id).toString();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAddingFriendId(friendId);
    setLoading(true);

    try {
      await groupService.addMemberToGroup(groupId, friendId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setAddedMemberIds((prev) => [...prev, friendId]);

      if (searchResults && (searchResults.id || searchResults._id).toString() === friendId) {
        setSearchResults(null);
      }

      showAlert({
        type: "success",
        title: "Friend Added! 🎉",
        message: `${friendUser.name} has joined the group directly.`,
      });
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert({
        type: "error",
        title: "Error",
        message: error.response?.data?.message || "Failed to add friend to group.",
      });
    } finally {
      setAddingFriendId(null);
      setLoading(false);
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

  const filteredFriends = friendsList.filter((friend) => {
    if (!friendFilter.trim()) return true;
    const query = friendFilter.toLowerCase().trim();
    return (
      (friend.name && friend.name.toLowerCase().includes(query)) ||
      (friend.email && friend.email.toLowerCase().includes(query)) ||
      (friend.username && friend.username.toLowerCase().includes(query))
    );
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <CustomAlert {...alertProps} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : null}
      >
        {/* Compact Header */}
        <View style={[styles.header, { paddingTop: 20 }]}>
          <View style={styles.headerRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="person-add" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.headerTextWrap}>
              <Text style={styles.title}>Add Member</Text>
              <Text style={styles.subtitle}>Bring friends into your group</Text>
            </View>
          </View>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "friends" && styles.activeTab]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab("friends");
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="people-outline"
              size={18}
              color={activeTab === "friends" ? COLORS.white : COLORS.gray}
            />
            <Text style={[styles.tabText, activeTab === "friends" && styles.activeTabText]}>
              My Friends
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
          {/* TAB 1: MY FRIENDS (DIRECT ADD) */}
          {activeTab === "friends" && (
            <Animated.View entering={FadeInUp.duration(400)} style={styles.tabView}>
              {/* Filter Friends Search Bar */}
              <View style={styles.searchBox}>
                <Ionicons name="search-outline" size={20} color={COLORS.gray} />
                <TextInput
                  key="friends-filter-input"
                  style={styles.input}
                  placeholder="Filter friends by name..."
                  placeholderTextColor={COLORS.gray + "80"}
                  value={friendFilter}
                  onChangeText={setFriendFilter}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={true}
                />
                {friendFilter.length > 0 && (
                  <TouchableOpacity onPress={() => setFriendFilter("")} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="close-circle" size={20} color={COLORS.gray} />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.resultsArea}>
                {loadingFriends ? (
                  <View style={styles.loadingGroupContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Loading your friends list...</Text>
                  </View>
                ) : filteredFriends.length > 0 ? (
                  filteredFriends.map((friend) => {
                    const friendId = (friend._id || friend.id).toString();
                    const isAlreadyMember = addedMemberIds.includes(friendId);
                    const isAddingThisFriend = addingFriendId === friendId;

                    return (
                      <Animated.View
                        key={friendId}
                        entering={FadeInUp.duration(300)}
                        style={styles.friendCard}
                      >
                        <View style={styles.squircleAvatar}>
                          {friend.avatar ? (
                            <Image source={{ uri: friend.avatar }} style={styles.resultAvatarImage} />
                          ) : (
                            <Text style={styles.avatarText}>
                              {(friend.name || "F").charAt(0).toUpperCase()}
                            </Text>
                          )}
                        </View>
                        <View style={styles.userInfo}>
                          <Text style={styles.userName} numberOfLines={1}>{friend.name}</Text>
                          <Text style={styles.userHandle} numberOfLines={1}>@{friend.username || "friend"}</Text>
                        </View>
                        {isAlreadyMember ? (
                          <View style={styles.alreadyMemberBadge}>
                            <Ionicons name="checkmark-circle" size={15} color="#10B981" />
                            <Text style={styles.alreadyMemberText}>Joined</Text>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={styles.directAddButton}
                            onPress={() => handleAddFriendDirectly(friend)}
                            disabled={isAddingThisFriend}
                            activeOpacity={0.85}
                          >
                            <LinearGradient
                              colors={[COLORS.primary, "#6366f1"]}
                              style={styles.directAddGradient}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                            >
                              {isAddingThisFriend ? (
                                <ActivityIndicator size="small" color="#FFF" />
                              ) : (
                                <>
                                  <Ionicons name="person-add" size={14} color="#FFF" style={{ marginRight: 4 }} />
                                  <Text style={styles.directAddText}>Add</Text>
                                </>
                              )}
                            </LinearGradient>
                          </TouchableOpacity>
                        )}
                      </Animated.View>
                    );
                  })
                ) : (
                  <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconBox}>
                      <Ionicons name="people-outline" size={40} color={COLORS.gray + "40"} />
                    </View>
                    <Text style={styles.emptyTitle}>
                      {friendFilter.length > 0 ? "No friends match filter" : "No friends found"}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                      {friendFilter.length > 0
                        ? "Try searching with a different name or username."
                        : "Add friends first to quickly add them directly to your groups!"}
                    </Text>
                  </View>
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
    padding: 16,
    paddingTop: 4,
    paddingBottom: 30,
  },
  tabView: {
    width: "100%",
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTextWrap: {
    flex: 1,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.primary + "12",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.dark,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 1,
    fontWeight: "500",
  },

  // Tab Styles
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: 12,
    padding: 3,
    marginHorizontal: 16,
    marginBottom: 10,
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
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
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
  friendCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#EBEBF0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  directAddButton: {
    borderRadius: 12,
    overflow: "hidden",
    height: 36,
    minWidth: 76,
  },
  directAddGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  directAddText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
  },
  alreadyMemberBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#A7F3D0",
    gap: 4,
  },
  alreadyMemberText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#059669",
  },
});
