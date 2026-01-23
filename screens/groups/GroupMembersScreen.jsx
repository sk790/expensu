import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { groupService } from "../../services/authService";
import { COLORS } from "../../utils/constants";
import { storage } from "../../utils/storage";

export default function GroupMembersScreen({ route, navigation }) {
  const { groupId, group, expenses } = route.params;
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [removing, setRemoving] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity style={styles.headerButton} onPress={shareInviteLink}>
          <Icon name="share" size={24} color={COLORS.primary} />
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

  // Check if current user is admin (group creator)
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

  const shareInviteLink = async () => {
    try {
      await Share.share({
        message: `Join my group "${group.name}" on ExpenseSplitter!\n\n${inviteLink}`,
        title: `Join ${group.name}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleMemberPress = (member) => {
    setSelectedMember(member);
    setModalVisible(true);
  };

  const handleShowExpenses = () => {
    setModalVisible(false);
    // Show only that person's expenses
    navigation.navigate("UserExpenses", {
      groupId: groupId,
      expenses: expenses,
      member: selectedMember,
    });
  };

  const handleRemoveMember = async () => {
    if (!isAdmin) {
      Alert.alert("Error", "Only admin can remove members");
      return;
    }

    Alert.alert(
      "Remove Member",
      `Are you sure you want to remove ${selectedMember.name} from this group?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setRemoving(true);
            try {
              await groupService.removeMember(groupId, selectedMember._id);
              Alert.alert("Success", "Member removed successfully");
              setModalVisible(false);
              // Refresh the group data
              const response = await groupService.getGroup(groupId);
              navigation.setParams({
                group: response.data,
                expenses: expenses,
              });
            } catch (error) {
              Alert.alert(
                "Error",
                error.response?.data?.message || "Failed to remove member",
              );
              console.log("Remove member error:", error);
            } finally {
              setRemoving(false);
            }
          },
        },
      ],
    );
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedMember(null);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Members</Text>
              <Text style={styles.summaryValue}>{membersList.length}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Expenses</Text>
              <Text style={styles.summaryValue}>
                ₹
                {expenses
                  ?.reduce((sum, exp) => sum + (exp.amount || 0), 0)
                  .toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Members List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Members & Payments</Text>

          {membersList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="people" size={40} color={COLORS.gray} />
              <Text style={styles.emptyText}>No members yet</Text>
            </View>
          ) : (
            <View style={styles.membersList}>
              {membersList.map((member, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.memberCard}
                  onPress={() => handleMemberPress(member)}
                  activeOpacity={0.7}
                >
                  <View style={styles.memberLeft}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.avatarText}>
                        {member.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>
                        {member.name}
                        {group?.createdBy?._id === member._id && (
                          <Text style={{ color: COLORS.primary, fontSize: 12 }}>
                            {" "}
                            (Admin)
                          </Text>
                        )}
                      </Text>
                      <Text style={styles.memberEmail}>{member.email}</Text>
                    </View>
                  </View>
                  <View style={styles.memberRight}>
                    <Text style={styles.paidLabel}>Paid</Text>
                    <Text style={styles.paidAmount}>
                      ₹{member.totalPaid.toFixed(2)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Add Member Info */}
        <View style={styles.infoCard}>
          <Icon name="info" size={20} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Click a member to view their expenses or remove them
          </Text>
        </View>
      </ScrollView>

      {/* Add Member Floating Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() =>
          navigation.navigate("AddMember", {
            groupId: groupId,
            currentMembers: group?.members || [],
          })
        }
      >
        <Icon name="person-add" size={24} color={COLORS.white} />
      </TouchableOpacity>

      {/* Bottom Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedMember && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalMemberInfo}>
                    <View style={styles.modalAvatar}>
                      <Text style={styles.modalAvatarText}>
                        {selectedMember.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.modalMemberName}>
                        {selectedMember.name}
                      </Text>
                      <Text style={styles.modalMemberEmail}>
                        {selectedMember.email}
                      </Text>
                      <Text style={styles.modalMemberPaid}>
                        Paid: ₹{selectedMember.totalPaid.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={closeModal}>
                    <Icon name="close" size={24} color={COLORS.dark} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalButtons}>
                  {/* Show Expenses Button */}
                  <TouchableOpacity
                    style={[styles.modalButton, styles.expensesButton]}
                    onPress={handleShowExpenses}
                  >
                    <Icon name="receipt" size={20} color={COLORS.white} />
                    <Text style={styles.modalButtonText}>Show Expenses</Text>
                  </TouchableOpacity>

                  {/* Remove Member Button - Only for Admin */}
                  {isAdmin && selectedMember._id !== currentUser.id && (
                    <TouchableOpacity
                      style={[styles.modalButton, styles.removeButton]}
                      onPress={handleRemoveMember}
                      disabled={removing}
                    >
                      {removing ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                      ) : (
                        <>
                          <Icon
                            name="person-remove"
                            size={20}
                            color={COLORS.white}
                          />
                          <Text style={styles.modalButtonText}>
                            Remove from Group
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}

                  {/* Cancel Button */}
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={closeModal}
                  >
                    <Icon name="clear" size={20} color={COLORS.primary} />
                    <Text
                      style={[
                        styles.modalButtonText,
                        { color: COLORS.primary },
                      ]}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  headerButton: {
    paddingRight: 16,
  },
  summaryCard: {
    backgroundColor: COLORS.light,
    borderRadius: 12,
    padding: 20,
    marginBottom: 25,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  summaryItem: {
    alignItems: "center",
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: "500",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.gray,
    opacity: 0.3,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 15,
  },
  membersList: {
    gap: 12,
  },
  memberCard: {
    flexDirection: "row",
    backgroundColor: COLORS.light,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "space-between",
  },
  memberLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 18,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.dark,
  },
  memberEmail: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
  memberRight: {
    alignItems: "flex-end",
  },
  paidLabel: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: "500",
    marginBottom: 2,
  },
  paidAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 10,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#E3F2FD",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    gap: 12,
    marginBottom: 30,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.dark,
    flex: 1,
  },
  floatingButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: COLORS.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    // backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  modalMemberInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  modalAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  modalAvatarText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 18,
  },
  modalMemberName: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.dark,
  },
  modalMemberEmail: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  modalMemberPaid: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "600",
    marginTop: 4,
  },
  modalButtons: {
    gap: 12,
  },
  modalButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 10,
    gap: 10,
  },
  expensesButton: {
    backgroundColor: COLORS.primary,
  },
  removeButton: {
    backgroundColor: "#ff6b6b",
  },
  cancelButton: {
    backgroundColor: COLORS.light,
  },
  modalButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "bold",
  },
});
