import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Share, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { groupService } from "../../services/authService";
import { COLORS } from "../../utils/constants";
import { FadeInDown, FadeInUp } from "react-native-reanimated";
import AnimatedView from "../../components/AnimatedView";
import * as Haptics from "expo-haptics";
import CustomAlert from "../../components/CustomAlert";
import { useAlert } from "../../hooks/useAlert";

export default function CreateGroupScreen({ navigation, route }) {
  const groupToEdit = route.params?.group;
  const isEditing = !!groupToEdit;

  const [groupName, setGroupName] = useState(groupToEdit?.name || "");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const { alertProps, showAlert } = useAlert();
  const insets = useSafeAreaInsets();

  const handleAction = async () => {
    if (!groupName.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert({ type: "error", title: "Missing Name", message: "Please give your group a name." });
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    try {
      if (isEditing) {
        await groupService.updateGroup(groupToEdit._id, groupName.trim());
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showAlert({
          type: "success",
          title: "Group Updated! ✨",
          message: `"${groupName}" has been successfully updated.`,
          buttons: [{ text: "Awesome", onPress: () => navigation.goBack() }],
        });
      } else {
        const response = await groupService.createGroup(groupName.trim(), []);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showAlert({
          type: "success",
          title: "Group Created! 🎉",
          message: `"${groupName}" is ready. Share the invite link with friends.`,
          buttons: [
            { text: "Share Invite", onPress: () => Share.share({ message: `Join "${groupName}" on Expensu!\n\n${response.inviteLink}` }) },
            { text: "Done", style: "cancel", onPress: () => navigation.goBack() },
          ],
        });
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert({ type: "error", title: "Error", message: error.response?.data?.message || `Failed to ${isEditing ? "update" : "create"} group` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.gradientStart} translucent />
      <CustomAlert {...alertProps} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Gradient hero */}
        <AnimatedView entering={FadeInDown.duration(400).delay(80)}>
          <View style={styles.heroSection}>
            <LinearGradient
              colors={[COLORS.gradientStart, COLORS.gradientEnd]}
              style={styles.iconCircle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name={isEditing ? "create" : "people"} size={34} color="#FFF" />
            </LinearGradient>
            <Text style={styles.heroTitle}>{isEditing ? "Edit Group" : "Create a Group"}</Text>
            <Text style={styles.heroSubtitle}>
              {isEditing ? "Update your group details below" : "Start a shared space to track expenses with friends"}
            </Text>
          </View>
        </AnimatedView>

        {/* Name input card */}
        <AnimatedView entering={FadeInDown.duration(400).delay(160)} style={styles.card}>
          <Text style={styles.inputLabel}>Group Name</Text>
          <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
            <Ionicons
              name="people-outline" size={20}
              color={focused ? COLORS.primary : COLORS.gray}
              style={styles.inputIcon}
            />
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

        {/* Tip banner */}
        <AnimatedView entering={FadeInDown.duration(400).delay(240)}>
          <View style={styles.tipBanner}>
            <LinearGradient
              colors={[COLORS.gradientStart + "18", COLORS.gradientEnd + "18"]}
              style={styles.tipBannerInner}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
              <Text style={styles.tipText}>After creating, you'll get a shareable invite link.</Text>
            </LinearGradient>
          </View>
        </AnimatedView>

        {/* CTA */}
        <AnimatedView entering={FadeInUp.duration(400).delay(320)}>
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
                  <Text style={styles.btnText}>{isEditing ? "Save Changes" : "Create Group"}</Text>
                  <Ionicons name={isEditing ? "checkmark" : "arrow-forward"} size={20} color="#FFF" style={{ marginLeft: 8 }} />
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
  root: { flex: 1, backgroundColor: "#F4F5FA" },
  scroll: { padding: 24, flexGrow: 1 },

  heroSection: { alignItems: "center", marginBottom: 32, marginTop: 8 },
  iconCircle: {
    width: 80, height: 80, borderRadius: 24,
    alignItems: "center", justifyContent: "center",
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
  },
  heroTitle: { fontSize: 26, fontWeight: "800", color: COLORS.dark, marginBottom: 8 },
  heroSubtitle: { fontSize: 14, color: COLORS.gray, textAlign: "center", lineHeight: 20 },

  card: {
    backgroundColor: "#FFF", borderRadius: 20,
    padding: 20, marginBottom: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
  },
  inputLabel: { fontSize: 13, fontWeight: "700", color: COLORS.gray, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  inputWrap: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: "#EBEBF0",
    borderRadius: 14, backgroundColor: "#FAFAFE", overflow: "hidden",
  },
  inputWrapFocused: { borderColor: COLORS.primary, backgroundColor: "#FFF" },
  inputIcon: { paddingHorizontal: 14 },
  input: { flex: 1, fontSize: 15, color: COLORS.dark, paddingVertical: 16, paddingRight: 16 },
  charCount: { fontSize: 12, color: COLORS.gray, textAlign: "right", marginTop: 8 },

  tipBanner: { marginBottom: 32, borderRadius: 14, overflow: "hidden" },
  tipBannerInner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 16,
    borderWidth: 1, borderColor: COLORS.primary + "25",
    borderRadius: 14,
  },
  tipText: { flex: 1, fontSize: 14, color: COLORS.dark, lineHeight: 20 },

  btnWrapper: { borderRadius: 16, overflow: "hidden" },
  btn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 18,
  },
  btnText: { color: "#FFF", fontSize: 17, fontWeight: "800" },
});
