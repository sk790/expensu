import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Share, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { groupService } from "../../services/authService";
import { COLORS } from "../../utils/constants";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import AnimatedView from "../../components/AnimatedView";
import * as Haptics from "expo-haptics";
import CustomAlert from "../../components/CustomAlert";
import { useAlert } from "../../hooks/useAlert";

export default function CreateGroupScreen({ navigation }) {
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const { alertProps, showAlert } = useAlert();

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert({ type: "error", title: "Missing Name", message: "Please give your group a name." });
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const response = await groupService.createGroup(groupName.trim(), []);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert({ type: "success", title: "Group Created! 🎉", message: `"${groupName}" is ready. Share the invite link with friends.`, buttons: [
        { text: "Share Invite", onPress: () => Share.share({ message: `Join "${groupName}" on Expensu!\n\n${response.inviteLink}` }) },
        { text: "Done", style: "cancel", onPress: () => navigation.goBack() },
      ]});
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert({ type: "error", title: "Error", message: error.response?.data?.message || "Failed to create group" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <CustomAlert {...alertProps} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <AnimatedView entering={FadeInDown.duration(400).delay(100)} style={styles.headerContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="people" size={36} color={COLORS.primary} />
          </View>
          <Text style={styles.headerTitle}>Create a Group</Text>
          <Text style={styles.headerSubtitle}>Start a shared space to track expenses with friends</Text>
        </AnimatedView>

        <AnimatedView entering={FadeInDown.duration(400).delay(200)} style={styles.card}>
          <Text style={styles.inputLabel}>Group Name</Text>
          <View style={[styles.inputWrapper, focused && styles.inputWrapperFocused]}>
            <Ionicons name="people-outline" size={20} color={focused ? COLORS.primary : COLORS.gray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. Goa Trip, Flat Mates..."
              placeholderTextColor={COLORS.gray}
              value={groupName}
              onChangeText={setGroupName}
              editable={!loading}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              maxLength={50}
            />
          </View>
          <Text style={styles.charCount}>{groupName.length}/50</Text>
        </AnimatedView>

        <AnimatedView entering={FadeInDown.duration(400).delay(300)} style={styles.tipsCard}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} style={{ marginRight: 10 }} />
          <Text style={styles.tipsText}>After creating, you'll get a shareable invite link.</Text>
        </AnimatedView>

        <AnimatedView entering={FadeInUp.duration(400).delay(400)}>
          <TouchableOpacity style={[styles.createButton, loading && styles.buttonDisabled]} onPress={handleCreateGroup} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color={COLORS.white} /> : (
              <>
                <Text style={styles.createButtonText}>Create Group</Text>
                <Ionicons name="arrow-forward" size={20} color={COLORS.white} style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
        </AnimatedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  content: { padding: 24, flexGrow: 1 },
  headerContainer: { alignItems: "center", marginTop: 16, marginBottom: 32 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary + '15', alignItems: "center", justifyContent: "center", marginBottom: 16 },
  headerTitle: { fontSize: 26, fontWeight: "bold", color: COLORS.dark, marginBottom: 8 },
  headerSubtitle: { fontSize: 14, color: COLORS.gray, textAlign: "center", lineHeight: 20 },
  card: { backgroundColor: COLORS.white, borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
  inputLabel: { fontSize: 14, fontWeight: "600", color: COLORS.gray, marginBottom: 10 },
  inputWrapper: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: "#F0F0F0", borderRadius: 14, backgroundColor: "#FAFAFA", overflow: "hidden" },
  inputWrapperFocused: { borderColor: COLORS.primary, backgroundColor: COLORS.white },
  inputIcon: { paddingHorizontal: 16 },
  input: { flex: 1, fontSize: 16, color: COLORS.dark, paddingVertical: 16, paddingRight: 16 },
  charCount: { fontSize: 12, color: COLORS.gray, textAlign: "right", marginTop: 8 },
  tipsCard: { flexDirection: "row", alignItems: "flex-start", backgroundColor: COLORS.primary + '10', borderRadius: 14, padding: 16, marginBottom: 32, borderWidth: 1, borderColor: COLORS.primary + '25' },
  tipsText: { flex: 1, fontSize: 14, color: COLORS.dark, lineHeight: 20 },
  createButton: { backgroundColor: COLORS.primary, flexDirection: "row", paddingVertical: 18, borderRadius: 16, alignItems: "center", justifyContent: "center", shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  buttonDisabled: { opacity: 0.7 },
  createButtonText: { color: COLORS.white, fontSize: 18, fontWeight: "bold" },
});
