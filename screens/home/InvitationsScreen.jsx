import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { groupInvitationService } from "../../services/authService";
import { COLORS } from "../../utils/constants";
import Animated, { FadeInDown, Layout } from "react-native-reanimated";
import AnimatedView from "../../components/AnimatedView";
import * as Haptics from "expo-haptics";
import CustomAlert from "../../components/CustomAlert";
import { useAlert } from "../../hooks/useAlert";
import LoadingSpinner from "../../components/LoadingSpinner";

export default function InvitationsScreen({ navigation }) {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const { alertProps, showAlert } = useAlert();

  const fetchInvitations = async () => {
    try {
      const response = await groupInvitationService.getMyInvitations();
      setInvitations(response.data);
    } catch (error) {
      console.error("Error fetching invitations:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleResponse = async (invitationId, status) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setProcessingId(invitationId);
    try {
      await groupInvitationService.respondToInvitation(invitationId, status);
      setInvitations((prev) => prev.filter((inv) => inv._id !== invitationId));
      
      if (status === "accepted") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showAlert({
          type: "success",
          title: "Joined!",
          message: "You have successfully joined the group.",
        });
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert({
        type: "error",
        title: "Error",
        message: error.response?.data?.message || "Failed to process invitation.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const renderItem = ({ item, index }) => (
    <AnimatedView
      entering={FadeInDown.delay(index * 100)}
      layout={Layout.springify()}
      style={styles.invitationCard}
    >
      <View style={styles.cardHeader}>
        <View style={styles.groupIconContainer}>
          <Ionicons name="people" size={24} color={COLORS.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.groupName}>{item.group.name}</Text>
          <Text style={styles.inviterText}>
            Invited by <Text style={styles.inviterName}>{item.inviter.name}</Text>
          </Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.btn, styles.btnReject]}
          onPress={() => handleResponse(item._id, "rejected")}
          disabled={!!processingId}
        >
          {processingId === item._id ? (
            <ActivityIndicator size="small" color={COLORS.danger} />
          ) : (
            <>
              <Ionicons name="close-circle-outline" size={18} color={COLORS.danger} />
              <Text style={styles.btnTextReject}>Decline</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnAccept]}
          onPress={() => handleResponse(item._id, "accepted")}
          disabled={!!processingId}
        >
          {processingId === item._id ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={18} color={COLORS.white} />
              <Text style={styles.btnTextAccept}>Accept</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </AnimatedView>
  );

  if (loading && !refreshing) {
    return <LoadingSpinner message="Checking for requests..." />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <CustomAlert {...alertProps} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.title}>Group Requests</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={invitations}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            fetchInvitations();
          }} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
              <Ionicons name="mail-open-outline" size={64} color={COLORS.gray} />
            </View>
            <Text style={styles.emptyTitle}>No Pending Requests</Text>
            <Text style={styles.emptySubtitle}>
              When someone invites you to a group, it will appear here.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: "#FFF",
  },
  backButton: { padding: 8, borderRadius: 12, backgroundColor: "#F1F5F9" },
  title: { fontSize: 20, fontWeight: "700", color: COLORS.dark },
  listContent: { padding: 20, flexGrow: 1 },
  invitationCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  groupIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: COLORS.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  headerText: { flex: 1 },
  groupName: { fontSize: 18, fontWeight: "700", color: COLORS.dark, marginBottom: 4 },
  inviterText: { fontSize: 13, color: COLORS.gray },
  inviterName: { fontWeight: "600", color: COLORS.primary },
  actionButtons: { flexDirection: "row", gap: 12 },
  btn: {
    flex: 1,
    flexDirection: "row",
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnAccept: { backgroundColor: COLORS.primary },
  btnReject: { backgroundColor: "#FFF", borderWidth: 1.5, borderColor: COLORS.danger + "30" },
  btnTextAccept: { color: "#FFF", fontWeight: "700", fontSize: 15 },
  btnTextReject: { color: COLORS.danger, fontWeight: "700", fontSize: 15 },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: 60 },
  emptyIconBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: COLORS.dark, marginBottom: 12 },
  emptySubtitle: {
    fontSize: 15,
    color: COLORS.gray,
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 22,
  },
});
