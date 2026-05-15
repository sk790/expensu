import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { groupService } from "../../services/authService";
import { COLORS } from "../../utils/constants";
import Animated, { FadeInDown, FadeInUp, ZoomIn } from "react-native-reanimated";
import AnimatedView from "../../components/AnimatedView";
import * as Haptics from "expo-haptics";
import CustomAlert from "../../components/CustomAlert";
import { useAlert } from "../../hooks/useAlert";

export default function JoinGroupScreen({ route, navigation }) {
  const { inviteCode } = route.params;
  const [groupInfo, setGroupInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const { alertProps, showAlert } = useAlert();

  useEffect(() => { fetchGroupInfo(); }, [inviteCode]);

  const fetchGroupInfo = async () => {
    try {
      const response = await groupService.getGroupByInvite(inviteCode);
      setGroupInfo(response.data);
    } catch (error) {
      showAlert({ type: "error", title: "Invalid Invite", message: error.response?.data?.message || "This invite link is invalid or has expired.", buttons: [
        { text: "OK", onPress: () => navigation.goBack() },
      ]});
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setJoining(true);
    try {
      const response = await groupService.joinGroupByInvite(inviteCode);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert({ type: "success", title: "You're In! 🎉", message: `Welcome to ${groupInfo.name}`, buttons: [
        { text: "Let's Go", onPress: () => navigation.replace("GroupDetail", { groupId: response.data._id }) },
      ]});
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert({ type: "error", title: "Error", message: error.response?.data?.message || "Failed to join group" });
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Looking up invite...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomAlert {...alertProps} />
      <View style={styles.content}>
        <AnimatedView entering={FadeInDown.duration(500).delay(100)} style={styles.heroSection}>
          <View style={styles.iconCircle}>
            <Ionicons name="link" size={40} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>You've been invited!</Text>
          <Text style={styles.subtitle}>Join a group and start splitting expenses</Text>
        </AnimatedView>

        {groupInfo && (
          <AnimatedView entering={ZoomIn.duration(400).delay(300)} style={styles.groupCard}>
            <View style={styles.groupAvatarLarge}>
              <Text style={styles.groupAvatarText}>{groupInfo.name.substring(0, 2).toUpperCase()}</Text>
            </View>
            <Text style={styles.groupName}>{groupInfo.name}</Text>
            <View style={styles.groupMeta}>
              <View style={styles.metaPill}>
                <Ionicons name="person-outline" size={14} color={COLORS.primary} />
                <Text style={styles.metaText}>Created by {groupInfo.createdBy.name}</Text>
              </View>
              <View style={styles.metaPill}>
                <Ionicons name="people-outline" size={14} color={COLORS.primary} />
                <Text style={styles.metaText}>{groupInfo.memberCount} {groupInfo.memberCount === 1 ? "member" : "members"}</Text>
              </View>
            </View>
          </AnimatedView>
        )}

        <AnimatedView entering={FadeInUp.duration(500).delay(500)}>
          <TouchableOpacity
            style={[styles.joinButton, joining && styles.buttonDisabled]}
            onPress={handleJoinGroup}
            disabled={joining}
            activeOpacity={0.85}
          >
            {joining ? <ActivityIndicator color={COLORS.white} /> : (
              <>
                <Text style={styles.joinButtonText}>Join Group</Text>
                <Ionicons name="arrow-forward" size={20} color={COLORS.white} style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()} disabled={joining}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </AnimatedView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8F9FA", gap: 16 },
  loadingText: { fontSize: 15, color: COLORS.gray },
  content: { flex: 1, padding: 24, justifyContent: "center" },
  heroSection: { alignItems: "center", marginBottom: 28 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary + '15', alignItems: "center", justifyContent: "center", marginBottom: 16 },
  title: { fontSize: 26, fontWeight: "bold", color: COLORS.dark, marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 15, color: COLORS.gray, textAlign: "center" },
  groupCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 28, marginBottom: 32, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.07, shadowRadius: 16, elevation: 4 },
  groupAvatarLarge: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primary + '20', alignItems: "center", justifyContent: "center", marginBottom: 16 },
  groupAvatarText: { fontSize: 26, fontWeight: "bold", color: COLORS.primary },
  groupName: { fontSize: 22, fontWeight: "bold", color: COLORS.dark, marginBottom: 16, textAlign: "center" },
  groupMeta: { flexDirection: "row", gap: 10, flexWrap: "wrap", justifyContent: "center" },
  metaPill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: COLORS.primary + '10', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  metaText: { fontSize: 13, color: COLORS.primary, fontWeight: "500" },
  joinButton: { backgroundColor: COLORS.primary, flexDirection: "row", paddingVertical: 18, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 14, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  buttonDisabled: { opacity: 0.7 },
  joinButtonText: { color: COLORS.white, fontSize: 18, fontWeight: "bold" },
  cancelButton: { paddingVertical: 14, alignItems: "center" },
  cancelButtonText: { color: COLORS.gray, fontSize: 16 },
});
