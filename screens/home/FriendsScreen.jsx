import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Dimensions,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeInUp, Layout } from "react-native-reanimated";
import AnimatedView from "../../components/AnimatedView";
import CustomAlert from "../../components/CustomAlert";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useAlert } from "../../hooks/useAlert";
import { friendService } from "../../services/authService";
import { COLORS } from "../../utils/constants";

const { width } = Dimensions.get("window");

function getInitials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
}

export default function FriendsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { alertProps, showAlert } = useAlert();

  const [activeTab, setActiveTab] = useState("friends"); // 'friends' | 'requests' | 'add'
  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  // Fetch friends list and requests
  const fetchData = useCallback(async () => {
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        friendService.getFriends(),
        friendService.getFriendRequests(),
      ]);

      if (friendsRes.success) {
        setFriends(friendsRes.friends || []);
      }
      if (requestsRes.success) {
        setIncomingRequests(requestsRes.incoming || []);
        setOutgoingRequests(requestsRes.outgoing || []);
      }
    } catch (error) {
      console.error("Error fetching friends data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
    if (searchQuery.trim()) {
      handleSearch(searchQuery);
    }
  };

  // Handle user search
  const handleSearch = async (text) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await friendService.searchUsers(text);
      if (res.success) {
        setSearchResults(res.users || []);
      }
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Send friend request
  const handleSendRequest = async (user) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActionLoading((prev) => ({ ...prev, [user._id]: true }));
    try {
      const res = await friendService.sendFriendRequest(user._id);
      if (res.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showAlert({
          type: "success",
          title: "Request Sent 🎉",
          message: `Friend request sent to ${user.name}!`,
        });

        // Update search result item state
        setSearchResults((prev) =>
          prev.map((item) =>
            item._id === user._id
              ? { ...item, friendshipStatus: "pending_sent" }
              : item
          )
        );
        fetchData();
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert({
        type: "error",
        title: "Error",
        message: error.response?.data?.message || "Failed to send friend request.",
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, [user._id]: false }));
    }
  };

  // Respond to friend request (accept / reject / cancel)
  const handleRespondRequest = async (requestId, action, targetUserId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActionLoading((prev) => ({ ...prev, [requestId]: true }));
    try {
      const res = await friendService.respondFriendRequest(requestId, action);
      if (res.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Update local requests state
        setIncomingRequests((prev) => prev.filter((r) => r._id !== requestId));
        setOutgoingRequests((prev) => prev.filter((r) => r._id !== requestId));

        if (targetUserId) {
          setSearchResults((prev) =>
            prev.map((item) =>
              item._id === targetUserId
                ? {
                    ...item,
                    friendshipStatus: action === "accepted" ? "friends" : "none",
                  }
                : item
            )
          );
        }

        fetchData();
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert({
        type: "error",
        title: "Error",
        message: error.response?.data?.message || "Failed to update request.",
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  // Remove a friend with confirmation
  const handleRemoveFriend = (friend) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Warning);
    showAlert({
      type: "warning",
      title: "Remove Friend",
      message: `Are you sure you want to remove ${friend.name} from your friends?`,
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setActionLoading((prev) => ({ ...prev, [friend._id]: true }));
            try {
              const res = await friendService.removeFriend(friend._id);
              if (res.success) {
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success
                );
                setFriends((prev) => prev.filter((f) => f._id !== friend._id));
                fetchData();
              }
            } catch (error) {
              showAlert({
                type: "error",
                title: "Error",
                message:
                  error.response?.data?.message || "Failed to remove friend.",
              });
            } finally {
              setActionLoading((prev) => ({ ...prev, [friend._id]: false }));
            }
          },
        },
      ],
    });
  };

  if (loading && !refreshing) {
    return <LoadingSpinner message="Loading friends..." />;
  }

  // Render Item for My Friends list
  const renderFriendItem = ({ item, index }) => (
    <AnimatedView
      entering={FadeInDown.duration(400).delay(index * 60)}
      layout={Layout.springify()}
      style={styles.userCard}
    >
      <View style={styles.avatarContainer}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
        ) : (
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            style={styles.avatarGradient}
          >
            <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
          </LinearGradient>
        )}
      </View>

      <View style={styles.userInfo}>
        <Text style={styles.userName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.userMeta} numberOfLines={1}>
          @{item.username} • {item.email}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.removeBtn}
        onPress={() => handleRemoveFriend(item)}
        disabled={actionLoading[item._id]}
      >
        {actionLoading[item._id] ? (
          <ActivityIndicator size="small" color="#EF4444" />
        ) : (
          <Ionicons name="person-remove-outline" size={20} color="#EF4444" />
        )}
      </TouchableOpacity>
    </AnimatedView>
  );

  // Render Item for Pending Incoming/Outgoing Requests
  const renderRequestItem = ({ item, isIncoming, index }) => {
    const user = isIncoming ? item.requester : item.recipient;
    if (!user) return null;

    const isLoading = actionLoading[item._id];

    return (
      <AnimatedView
        entering={FadeInDown.duration(400).delay(index * 60)}
        layout={Layout.springify()}
        style={styles.userCard}
      >
        <View style={styles.avatarContainer}>
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
          ) : (
            <LinearGradient
              colors={[COLORS.gradientStart, COLORS.gradientEnd]}
              style={styles.avatarGradient}
            >
              <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
            </LinearGradient>
          )}
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            {user.name}
          </Text>
          <Text style={styles.userMeta} numberOfLines={1}>
            @{user.username}
          </Text>
        </View>

        {isIncoming ? (
          <View style={styles.requestActionRow}>
            <TouchableOpacity
              style={styles.declineIconBtn}
              onPress={() => handleRespondRequest(item._id, "rejected", user._id)}
              disabled={isLoading}
            >
              <Ionicons name="close" size={18} color="#EF4444" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={() => handleRespondRequest(item._id, "accepted", user._id)}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={16} color="#FFF" />
                  <Text style={styles.acceptBtnText}>Accept</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => handleRespondRequest(item._id, "cancel", user._id)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={COLORS.gray} />
            ) : (
              <Text style={styles.cancelBtnText}>Cancel</Text>
            )}
          </TouchableOpacity>
        )}
      </AnimatedView>
    );
  };

  // Render Item for Search Results
  const renderSearchItem = ({ item, index }) => {
    const isLoading = actionLoading[item._id];

    return (
      <AnimatedView
        entering={FadeInDown.duration(400).delay(index * 60)}
        layout={Layout.springify()}
        style={styles.userCard}
      >
        <View style={styles.avatarContainer}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
          ) : (
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              style={styles.avatarGradient}
            >
              <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
            </LinearGradient>
          )}
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.userMeta} numberOfLines={1}>
            @{item.username}
          </Text>
        </View>

        {item.friendshipStatus === "friends" && (
          <View style={styles.badgeFriends}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.badgeFriendsText}>Friends</Text>
          </View>
        )}

        {item.friendshipStatus === "pending_sent" && (
          <View style={styles.badgePending}>
            <Ionicons name="time-outline" size={16} color="#F59E0B" />
            <Text style={styles.badgePendingText}>Requested</Text>
          </View>
        )}

        {item.friendshipStatus === "pending_received" && (
          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={() =>
              handleRespondRequest(item.requestId, "accepted", item._id)
            }
            disabled={isLoading}
          >
            <Text style={styles.acceptBtnText}>Accept</Text>
          </TouchableOpacity>
        )}

        {item.friendshipStatus === "none" && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => handleSendRequest(item)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="person-add" size={16} color="#FFF" />
                <Text style={styles.addBtnText}>Add</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </AnimatedView>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.gradientStart} translucent />
      <CustomAlert {...alertProps} />

      {/* Header */}
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        style={[styles.header, { paddingTop: insets.top + 14 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerTop}>
          <View style={styles.headerTitleRow}>
            <Ionicons name="people-circle" size={32} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.headerTitle}>Friends</Text>
            {friends.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{friends.length}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Sub-tab segment pills */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === "friends" && styles.segmentBtnActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab("friends");
            }}
          >
            <Text style={[styles.segmentText, activeTab === "friends" && styles.segmentTextActive]}>
              My Friends ({friends.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === "requests" && styles.segmentBtnActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab("requests");
            }}
          >
            <Text style={[styles.segmentText, activeTab === "requests" && styles.segmentTextActive]}>
              Requests
            </Text>
            {incomingRequests.length > 0 && (
              <View style={styles.dotBadge}>
                <Text style={styles.dotBadgeText}>{incomingRequests.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === "add" && styles.segmentBtnActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab("add");
            }}
          >
            <Ionicons
              name="search"
              size={14}
              color={activeTab === "add" ? COLORS.primary : "rgba(255,255,255,0.8)"}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.segmentText, activeTab === "add" && styles.segmentTextActive]}>
              Find
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Main Content Body */}
      <View style={styles.container}>
        {/* TAB 1: MY FRIENDS */}
        {activeTab === "friends" && (
          <FlatList
            data={friends}
            renderItem={renderFriendItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={[
              styles.listContent,
              friends.length === 0 && { flexGrow: 1 },
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.primary]}
                tintColor={COLORS.primary}
              />
            }
            ListEmptyComponent={
              <AnimatedView entering={FadeInUp.duration(500)} style={styles.emptyContainer}>
                <LinearGradient
                  colors={[COLORS.primary + "15", COLORS.secondary + "15"]}
                  style={styles.emptyIconCircle}
                >
                  <Ionicons name="people-outline" size={52} color={COLORS.primary} />
                </LinearGradient>
                <Text style={styles.emptyTitle}>No Friends Yet 🤝</Text>
                <Text style={styles.emptySubtitle}>
                  Add friends to easily split expenses, track payments, and share group bills!
                </Text>
                <TouchableOpacity
                  style={styles.findFriendsBtn}
                  onPress={() => setActiveTab("add")}
                >
                  <Ionicons name="person-add-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={styles.findFriendsBtnText}>Find & Add Friends</Text>
                </TouchableOpacity>
              </AnimatedView>
            }
          />
        )}

        {/* TAB 2: REQUESTS */}
        {activeTab === "requests" && (
          <FlatList
            data={[
              ...(incomingRequests.length > 0 ? [{ isHeader: true, title: "INCOMING REQUESTS" }] : []),
              ...incomingRequests.map((item) => ({ ...item, isIncoming: true })),
              ...(outgoingRequests.length > 0 ? [{ isHeader: true, title: "SENT REQUESTS" }] : []),
              ...outgoingRequests.map((item) => ({ ...item, isIncoming: false })),
            ]}
            keyExtractor={(item, index) => item._id || `header-${index}`}
            renderItem={({ item, index }) => {
              if (item.isHeader) {
                return <Text style={styles.sectionHeaderTitle}>{item.title}</Text>;
              }
              return renderRequestItem({ item, isIncoming: item.isIncoming, index });
            }}
            contentContainerStyle={[
              styles.listContent,
              incomingRequests.length === 0 && outgoingRequests.length === 0 && { flexGrow: 1 },
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.primary]}
                tintColor={COLORS.primary}
              />
            }
            ListEmptyComponent={
              <AnimatedView entering={FadeInUp.duration(500)} style={styles.emptyContainer}>
                <LinearGradient
                  colors={[COLORS.primary + "15", COLORS.secondary + "15"]}
                  style={styles.emptyIconCircle}
                >
                  <Ionicons name="mail-open-outline" size={52} color={COLORS.primary} />
                </LinearGradient>
                <Text style={styles.emptyTitle}>No Pending Requests ✨</Text>
                <Text style={styles.emptySubtitle}>
                  You don't have any pending friend requests right now.
                </Text>
              </AnimatedView>
            }
          />
        )}

        {/* TAB 3: FIND / ADD FRIENDS */}
        {activeTab === "add" && (
          <View style={{ flex: 1 }}>
            {/* Search Input Bar */}
            <View style={styles.searchBarWrapper}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color={COLORS.gray} style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by name, username, or email..."
                  placeholderTextColor={COLORS.gray}
                  value={searchQuery}
                  onChangeText={handleSearch}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => handleSearch("")}>
                    <Ionicons name="close-circle" size={20} color={COLORS.gray} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {isSearching ? (
              <View style={styles.searchLoadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.searchLoadingText}>Searching registered users...</Text>
              </View>
            ) : (
              <FlatList
                data={searchResults}
                renderItem={renderSearchItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={[
                  styles.listContent,
                  searchResults.length === 0 && { flexGrow: 1 },
                ]}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons
                      name={searchQuery.trim() ? "search-outline" : "person-search-outline"}
                      size={52}
                      color={COLORS.gray}
                      style={{ opacity: 0.5, marginBottom: 12 }}
                    />
                    <Text style={styles.emptyTitle}>
                      {searchQuery.trim() ? "No Users Found" : "Search for Friends"}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                      {searchQuery.trim()
                        ? `No users matched "${searchQuery}". Try searching by full username or email.`
                        : "Type a friend's name, username (e.g. @john), or email above to send a request."}
                    </Text>
                  </View>
                }
              />
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F4F5FA" },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: -0.3,
  },
  countBadge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  countBadgeText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "800",
  },
  segmentContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(0, 0, 0, 0.15)",
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentBtnActive: {
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.85)",
  },
  segmentTextActive: {
    color: COLORS.primary,
  },
  dotBadge: {
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
    paddingHorizontal: 4,
  },
  dotBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "800",
  },
  container: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#AAA",
    letterSpacing: 1.2,
    marginTop: 12,
    marginBottom: 8,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    marginRight: 14,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.dark,
    marginBottom: 2,
  },
  userMeta: {
    fontSize: 13,
    color: COLORS.gray,
    fontWeight: "500",
  },
  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
  },
  requestActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  declineIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
  },
  acceptBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  acceptBtnText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
  },
  cancelBtn: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  cancelBtnText: {
    color: COLORS.gray,
    fontSize: 13,
    fontWeight: "600",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  addBtnText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
  },
  badgeFriends: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  badgeFriendsText: {
    color: "#059669",
    fontSize: 12,
    fontWeight: "700",
  },
  badgePending: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  badgePendingText: {
    color: "#D97706",
    fontSize: 12,
    fontWeight: "700",
  },
  searchBarWrapper: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.dark,
  },
  searchLoadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  searchLoadingText: {
    color: COLORS.gray,
    fontSize: 14,
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.dark,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  findFriendsBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    elevation: 3,
  },
  findFriendsBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 15,
  },
});
