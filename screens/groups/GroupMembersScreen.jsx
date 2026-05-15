import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import React, { useCallback, useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import AnimatedView from "../../components/AnimatedView";
import CustomAlert from "../../components/CustomAlert";
import { useAlert } from "../../hooks/useAlert";
import { groupService } from "../../services/authService";
import { COLORS } from "../../utils/constants";
import { storage } from "../../utils/storage";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";

export default function GroupMembersScreen({ route, navigation }) {
  const { groupId, group, expenses } = route.params;
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [removing, setRemoving] = useState(false);
  const { alertProps, showAlert } = useAlert();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity style={styles.headerButton} onPress={shareInviteLink}>
          <Ionicons
            name="share-social-outline"
            size={24}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, inviteLink]);

  useFocusEffect(
    useCallback(() => {
      fetchInviteLink();
      getCurrentUser();
    }, [groupId]),
  );

  const fetchInviteLink = async () => {
    try {
      const response = await groupService.getGroup(groupId);
      setInviteLink(response.inviteLink);
    } catch (error) {
      console.log("Failed to fetch invite link:", error);
    }
  };

  const getCurrentUser = async () => {
    try {
      const user = await storage.getUser();
      setCurrentUser(user);
    } catch (error) {
      console.log("Failed to get current user:", error);
    }
  };

  const isAdmin = currentUser && group?.createdBy?._id === currentUser.id;

  // Calculate total paid by each member
  const memberPayments = {};
  group?.members?.forEach((member) => {
    memberPayments[member._id] = {
      _id: member._id,
      name: member.name,
      email: member.email,
      totalPaid: 0,
    };
  });
  expenses?.forEach((expense) => {
    if (expense.paidBy && memberPayments[expense.paidBy._id]) {
      memberPayments[expense.paidBy._id].totalPaid += expense.amount || 0;
    }
  });
  const membersList = Object.values(memberPayments).sort(
    (a, b) => b.totalPaid - a.totalPaid,
  );
  const totalGroupSpend =
    expenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;

  const shareInviteLink = async () => {
    try {
      await Share.share({
        message: `Join my group "${group.name}" on Expensu!\n\n${inviteLink}`,
        title: `Join ${group.name}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleMemberPress = (member) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMember(member);
    setModalVisible(true);
  };

  const handleShowExpenses = () => {
    setModalVisible(false);
    navigation.navigate("UserExpenses", {
      groupId,
      expenses,
      member: selectedMember,
    });
  };

  const handleRemoveMember = () => {
    if (!isAdmin) {
      showAlert({
        type: "error",
        title: "Not Authorized",
        message: "Only the group admin can remove members.",
      });
      return;
    }
    showAlert({
      type: "confirm",
      title: "Remove Member",
      message: `Remove ${selectedMember.name} from this group?`,
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setRemoving(true);
            try {
              await groupService.removeMember(groupId, selectedMember._id);
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
              setModalVisible(false);
              const response = await groupService.getGroup(groupId);
              navigation.setParams({ group: response.data, expenses });
              showAlert({
                type: "success",
                title: "Removed",
                message: `${selectedMember.name} has been removed from the group.`,
              });
            } catch (error) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              showAlert({
                type: "error",
                title: "Error",
                message:
                  error.response?.data?.message || "Failed to remove member",
              });
            } finally {
              setRemoving(false);
            }
          },
        },
      ],
    });
  };

  const translateY = useSharedValue(600);
  const opacity = useSharedValue(0);

  const closeModal = () => {
    translateY.value = withTiming(600, { duration: 300 }, () => {
      runOnJS(setModalVisible)(false);
      runOnJS(setSelectedMember)(null);
    });
    opacity.value = withTiming(0, { duration: 300 });
  };

  React.useEffect(() => {
    if (modalVisible) {
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 90,
      });
      opacity.value = withTiming(1, { duration: 300 });
    }
  }, [modalVisible]);

  const panGesture = Gesture.Pan()
    .onStart((_) => {
      translateY.value = translateY.value;
    })
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 150 || event.velocityY > 500) {
        runOnJS(closeModal)();
      } else {
        translateY.value = withSpring(0);
      }
    });

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const animatedOverlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const getInitials = (name) =>
    name ? name.substring(0, 2).toUpperCase() : "?";

  return (
    <View style={styles.container}>
      <CustomAlert {...alertProps} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Stats Hero */}
        <AnimatedView
          entering={FadeInDown.duration(400).delay(100)}
          style={styles.statsCard}
        >
          <View style={styles.statItem}>
            <View style={styles.statIconBox}>
              <Ionicons
                name="people-outline"
                size={22}
                color={COLORS.primary}
              />
            </View>
            <Text style={styles.statValue}>{membersList.length}</Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={styles.statIconBox}>
              <Ionicons
                name="receipt-outline"
                size={22}
                color={COLORS.primary}
              />
            </View>
            <Text style={styles.statValue}>{expenses?.length || 0}</Text>
            <Text style={styles.statLabel}>Expenses</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={styles.statIconBox}>
              <Ionicons
                name="wallet-outline"
                size={22}
                color={COLORS.primary}
              />
            </View>
            <Text style={styles.statValue}>₹{totalGroupSpend.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
        </AnimatedView>

        {/* Invite Card */}
        <AnimatedView
          entering={FadeInDown.duration(400).delay(180)}
          style={styles.inviteCard}
        >
          <View style={styles.inviteLeft}>
            <Ionicons name="link-outline" size={20} color={COLORS.primary} />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.inviteTitle}>Invite Link</Text>
              <Text style={styles.inviteSubtitle}>
                Share to add new members
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={shareInviteLink}
            activeOpacity={0.8}
          >
            <Ionicons
              name="share-social-outline"
              size={18}
              color={COLORS.white}
            />
            <Text style={styles.shareBtnText}>Share</Text>
          </TouchableOpacity>
        </AnimatedView>

        {/* Members List */}
        <AnimatedView entering={FadeInDown.duration(400).delay(260)}>
          <Text style={styles.sectionTitle}>Members & Payments</Text>

          {membersList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBg}>
                <Ionicons name="people-outline" size={40} color={COLORS.gray} />
              </View>
              <Text style={styles.emptyTitle}>No members yet</Text>
              <Text style={styles.emptySubtext}>
                Tap + to add your first member
              </Text>
            </View>
          ) : (
            <View style={styles.membersCard}>
              {membersList.map((member, index) => {
                const isCreator = group?.createdBy?._id === member._id;
                const isMe = currentUser?.id === member._id;
                return (
                  <AnimatedView
                    key={member._id}
                    entering={ZoomIn.duration(300).delay(100 + index * 50)}
                    layout={Layout.springify()}
                  >
                    <TouchableOpacity
                      style={[
                        styles.memberRow,
                        index !== membersList.length - 1 && styles.memberBorder,
                      ]}
                      onPress={() => handleMemberPress(member)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.memberAvatar,
                          isCreator && styles.memberAvatarAdmin,
                        ]}
                      >
                        <Text
                          style={[
                            styles.avatarText,
                            isCreator && styles.avatarTextAdmin,
                          ]}
                        >
                          {getInitials(member.name)}
                        </Text>
                      </View>
                      <View style={styles.memberInfo}>
                        <View style={styles.memberNameRow}>
                          <Text style={styles.memberName}>{member.name}</Text>
                          {isCreator && (
                            <View style={styles.adminBadge}>
                              <Ionicons
                                name="shield-checkmark"
                                size={11}
                                color={COLORS.primary}
                              />
                              <Text style={styles.adminBadgeText}>Admin</Text>
                            </View>
                          )}
                          {isMe && !isCreator && (
                            <View style={styles.meBadge}>
                              <Text style={styles.meBadgeText}>You</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.memberEmail}>{member.email}</Text>
                      </View>
                      <View style={styles.memberRight}>
                        <Text style={styles.paidLabel}>Paid</Text>
                        <Text
                          style={[
                            styles.paidAmount,
                            member.totalPaid === 0 && styles.paidAmountZero,
                          ]}
                        >
                          ₹{member.totalPaid.toFixed(2)}
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color="#D0D0D0"
                        style={{ marginLeft: 4 }}
                      />
                    </TouchableOpacity>
                  </AnimatedView>
                );
              })}
            </View>
          )}
        </AnimatedView>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <AnimatedView
        entering={ZoomIn.duration(400).delay(400)}
        style={[styles.fabContainer, { bottom: 16 }]}
      >
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            navigation.navigate("AddMember", {
              groupId,
              currentMembers: group?.members || [],
            });
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="person-add-outline" size={22} color={COLORS.white} />
          <Text style={styles.fabLabel}>Add Member</Text>
        </TouchableOpacity>
      </AnimatedView>

      {/* Gesture Controlled Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        onRequestClose={closeModal}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.5)" }, animatedOverlayStyle]}>
              <TouchableOpacity
                style={StyleSheet.absoluteFillObject}
                onPress={closeModal}
                activeOpacity={1}
              />
            </Animated.View>
            
            <GestureDetector gesture={panGesture}>
              <Animated.View
                style={[styles.modalSheet, animatedSheetStyle]}
              >
                {/* Handle */}
                <View style={styles.modalHandle} />

                {selectedMember && (
                  <>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                      <View style={styles.modalAvatarContainer}>
                        <View
                          style={[
                            styles.modalAvatar,
                            group?.createdBy?._id === selectedMember._id &&
                              styles.memberAvatarAdmin,
                          ]}
                        >
                          <Text
                            style={[
                              styles.modalAvatarText,
                              group?.createdBy?._id === selectedMember._id &&
                                styles.avatarTextAdmin,
                            ]}
                          >
                            {getInitials(selectedMember.name)}
                          </Text>
                        </View>
                        {group?.createdBy?._id === selectedMember._id && (
                          <View style={styles.adminBadgeFloating}>
                            <Ionicons name="shield-checkmark" size={12} color="#FFF" />
                          </View>
                        )}
                      </View>
                      
                      <View style={styles.modalTitleSection}>
                        <Text style={styles.modalMemberName}>{selectedMember.name}</Text>
                        <Text style={styles.modalMemberEmail}>{selectedMember.email}</Text>
                      </View>
                    </View>

                    {/* Stats Summary Card */}
                    <View style={styles.modalStatsCard}>
                      <View style={styles.modalStatItem}>
                        <Text style={styles.modalStatLabel}>Total Contribution</Text>
                        <Text style={styles.modalStatValue}>₹{selectedMember.totalPaid?.toFixed(2)}</Text>
                      </View>
                      <View style={styles.modalStatDivider} />
                      <View style={styles.modalStatItem}>
                        <Text style={styles.modalStatLabel}>Status</Text>
                        <View style={styles.statusPill}>
                          <View style={styles.statusDot} />
                          <Text style={styles.statusText}>Active</Text>
                        </View>
                      </View>
                    </View>

                    {/* Actions Section */}
                    <Text style={styles.modalSectionTitle}>Member Actions</Text>
                    <View style={styles.modalActionsList}>
                      <TouchableOpacity
                        style={styles.actionCard}
                        onPress={handleShowExpenses}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.actionIconBox, { backgroundColor: COLORS.primary + "15" }]}>
                          <Ionicons name="receipt" size={22} color={COLORS.primary} />
                        </View>
                        <View style={styles.actionInfo}>
                          <Text style={styles.actionCardTitle}>View Expenses</Text>
                          <Text style={styles.actionCardSub}>Detailed payment history</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#C0C0C0" />
                      </TouchableOpacity>

                      {isAdmin && selectedMember._id !== currentUser?.id && (
                        <TouchableOpacity
                          style={[styles.actionCard, removing && { opacity: 0.6 }]}
                          onPress={handleRemoveMember}
                          disabled={removing}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.actionIconBox, { backgroundColor: COLORS.danger + "15" }]}>
                            {removing ? (
                              <ActivityIndicator size="small" color={COLORS.danger} />
                            ) : (
                              <Ionicons name="person-remove" size={22} color={COLORS.danger} />
                            )}
                          </View>
                          <View style={styles.actionInfo}>
                            <Text style={[styles.actionCardTitle, { color: COLORS.danger }]}>Remove Member</Text>
                            <Text style={styles.actionCardSub}>Withdraw from group access</Text>
                          </View>
                          <Ionicons name="chevron-forward" size={18} color="#C0C0C0" />
                        </TouchableOpacity>
                      )}
                    </View>

                    <TouchableOpacity
                      style={styles.closeActionBtn}
                      onPress={closeModal}
                    >
                      <Text style={styles.closeActionText}>Close Profile</Text>
                    </TouchableOpacity>
                  </>
                )}
              </Animated.View>
            </GestureDetector>
          </View>
        </GestureHandlerRootView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  content: { padding: 20 },
  headerButton: { paddingRight: 16 },

  // Stats Card
  statsCard: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    alignItems: "center",
  },
  statItem: { flex: 1, alignItems: "center" },
  statIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary + "12",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 2,
  },
  statLabel: { fontSize: 11, color: COLORS.gray, fontWeight: "500" },
  statDivider: { width: 1, height: 48, backgroundColor: "#F0F0F0" },

  // Invite Card
  inviteCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary + "10",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.primary + "25",
  },
  inviteLeft: { flex: 1, flexDirection: "row", alignItems: "center" },
  inviteTitle: { fontSize: 15, fontWeight: "bold", color: COLORS.dark },
  inviteSubtitle: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  shareBtnText: { fontSize: 14, fontWeight: "bold", color: COLORS.white },

  // Members
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 14,
  },
  membersCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  memberBorder: { borderBottomWidth: 1, borderBottomColor: "#F5F5F5" },
  memberAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.primary + "18",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  memberAvatarAdmin: { backgroundColor: COLORS.primary + "25" },
  avatarText: { color: COLORS.primary, fontWeight: "bold", fontSize: 16 },
  avatarTextAdmin: { color: COLORS.primary },
  memberInfo: { flex: 1 },
  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 3,
  },
  memberName: { fontSize: 15, fontWeight: "600", color: COLORS.dark },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary + "15",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  adminBadgeText: { fontSize: 10, fontWeight: "700", color: COLORS.primary },
  meBadge: {
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  meBadgeText: { fontSize: 10, fontWeight: "700", color: COLORS.gray },
  memberEmail: { fontSize: 12, color: COLORS.gray },
  memberRight: { alignItems: "flex-end", marginRight: 6 },
  paidLabel: {
    fontSize: 10,
    color: COLORS.gray,
    fontWeight: "500",
    marginBottom: 2,
  },
  paidAmount: { fontSize: 15, fontWeight: "bold", color: COLORS.primary },
  paidAmountZero: { color: "#C0C0C0" },

  // Empty
  emptyContainer: {
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingVertical: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 6,
  },
  emptySubtext: { fontSize: 14, color: COLORS.gray },

  // FAB
  fabContainer: { position: "absolute", right: 20, bottom: 28 },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },

  // FAB
  fabContainer: { position: "absolute", right: 24 },
  fab: {
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    gap: 10,
    // Explicitly no shadow
    shadowColor: "transparent",
    elevation: 0,
  },
  fabLabel: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  // Modal Sheet Enhancement
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalSheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#EEE",
    alignSelf: "center",
    marginBottom: 24,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  modalAvatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  modalAvatarText: {
    fontSize: 32,
    fontWeight: "800",
    color: COLORS.primary,
  },
  adminBadgeFloating: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFF",
  },
  modalTitleSection: {
    alignItems: "center",
  },
  modalMemberName: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.dark,
    marginBottom: 4,
  },
  modalMemberEmail: {
    fontSize: 14,
    color: COLORS.gray,
  },
  modalStatsCard: {
    flexDirection: "row",
    backgroundColor: "#F8F9FA",
    borderRadius: 20,
    padding: 18,
    marginBottom: 28,
  },
  modalStatItem: {
    flex: 1,
    alignItems: "center",
  },
  modalStatLabel: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  modalStatValue: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.primary,
  },
  modalStatDivider: {
    width: 1,
    height: "100%",
    backgroundColor: "#E0E0E0",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#E1F9F1",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  statusText: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "700",
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.gray,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  modalActionsList: {
    gap: 12,
    marginBottom: 32,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: "#F0F0F0",
    borderRadius: 18,
    padding: 14,
  },
  actionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  actionInfo: {
    flex: 1,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.dark,
  },
  actionCardSub: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  closeActionBtn: {
    height: 56,
    borderRadius: 16,
    backgroundColor: "#F4F5FA",
    justifyContent: "center",
    alignItems: "center",
  },
  closeActionText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.gray,
  },
});
