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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { userService, groupInvitationService } from "../../services/authService";
import { COLORS } from "../../utils/constants";
import Animated, { FadeInUp, Layout, ZoomIn } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import CustomAlert from "../../components/CustomAlert";
import { useAlert } from "../../hooks/useAlert";

export default function AddMemberScreen({ route, navigation }) {
  const { groupId, currentMembers } = route.params;
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [invitationStatus, setInvitationStatus] = useState(null);
  const { alertProps, showAlert } = useAlert();

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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert({
        type: "success",
        title: "Invitation Sent!",
        message: `A request has been sent to ${searchResults.name}.`,
        buttons: [{ text: "Great!", onPress: () => navigation.goBack() }],
      });
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <CustomAlert {...alertProps} />
      
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : null}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
          keyboardShouldPersistTaps="always"
        >
          {/* Header - Simplified */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="person-add" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.title}>Add Member</Text>
            <Text style={styles.subtitle}>Find and invite friends to your group</Text>
          </View>

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
                    <Text style={styles.avatarText}>{searchResults.name.substring(0, 1).toUpperCase()}</Text>
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
                    <View style={styles.pendingBadge}>
                      <Ionicons name="time" size={18} color="#FF9500" />
                      <Text style={styles.pendingText}>Invitation Pending</Text>
                    </View>
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
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: "#F0F4F8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.dark,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray,
    marginTop: 6,
    fontWeight: "500",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 64,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  input: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.dark,
    marginLeft: 12,
  },
  resultsArea: {
    marginTop: 32,
  },
  userCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  squircleAvatar: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "800",
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 19,
    fontWeight: "700",
    color: COLORS.dark,
  },
  userHandle: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
    marginTop: 2,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F0F7FF",
    alignItems: "center",
    justifyContent: "center",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 20,
  },
  emailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  emailText: {
    fontSize: 15,
    color: COLORS.gray,
    fontWeight: "500",
    marginLeft: 8,
  },
  actionRow: {
    width: "100%",
  },
  inviteButton: {
    width: "100%",
    height: 56,
    borderRadius: 18,
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
    fontSize: 16,
    fontWeight: "700",
  },
  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF9F0",
    height: 56,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#FFE5BC",
  },
  pendingText: {
    color: "#FF9500",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  emptyIconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F5F7FA",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.dark,
  },
  emptySubtitle: {
    fontSize: 15,
    color: COLORS.gray,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 40,
    lineHeight: 22,
  },
});
