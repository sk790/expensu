import React, { useState } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { groupService, userService } from "../../services/authService";
import { COLORS } from "../../utils/constants";
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
  ZoomIn,
} from "react-native-reanimated";
import AnimatedView from "../../components/AnimatedView";
import * as Haptics from "expo-haptics";
import CustomAlert from "../../components/CustomAlert";
import { useAlert } from "../../hooks/useAlert";

export default function AddMemberScreen({ route, navigation }) {
  const { groupId, currentMembers } = route.params;

  const [email, setEmail] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [focusedInput, setFocusedInput] = useState(false);
  const { alertProps, showAlert } = useAlert();

  const handleSearchUser = async () => {
    if (!email.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert({
        type: "error",
        title: "Missing Input",
        message: "Please enter an email or username to search.",
      });
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearching(true);
    try {
      const response = await userService.searchUserByEmail(email.trim());

      const isAlreadyMember = currentMembers.some(
        (member) => member._id === response.user._id,
      );

      if (isAlreadyMember) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        showAlert({
          type: "warning",
          title: "Already a Member",
          message: "This user is already a part of your group.",
        });
        setSearchResults(null);
        return;
      }

      setSearchResults(response.user);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert({
        type: "error",
        title: "Not Found",
        message:
          error.response?.data?.message ||
          "We couldn't find a user with this email or username.",
      });
      setSearchResults(null);
    } finally {
      setSearching(false);
    }
  };

  const handleAddMember = async () => {
    if (!searchResults) {
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      await groupService.addMemberToGroup(groupId, searchResults.id);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert({
        type: "success",
        title: "Member Added!",
        message: `${searchResults.name} has been added to the group.`,
        buttons: [
          {
            text: "Awesome",
            onPress: () => {
              setEmail("");
              setSearchResults(null);
              navigation.goBack();
            },
          },
        ],
      });
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert({
        type: "error",
        title: "Oops",
        message:
          error.response?.data?.message || "Failed to add member to the group.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.containerWrapper}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
    >
      <CustomAlert {...alertProps} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {/* Header Section */}
        <AnimatedView
          entering={FadeInDown.duration(400).delay(100)}
          style={styles.headerContainer}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="person-add" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.headerTitle}>Add Member</Text>
          <Text style={styles.headerSubtitle}>
            Search by email or username to add friends
          </Text>
        </AnimatedView>

        {/* Search Bar */}
        <AnimatedView entering={FadeInDown.duration(400).delay(200)}>
          <View
            style={[
              styles.searchContainer,
              focusedInput && styles.searchContainerFocused,
            ]}
          >
            <Ionicons
              name="search-outline"
              size={20}
              color={focusedInput ? COLORS.primary : COLORS.gray}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Email or username"
              placeholderTextColor={COLORS.gray}
              value={email}
              onChangeText={setEmail}
              keyboardType="default"
              autoCapitalize="none"
              editable={!loading && !searching}
              onFocus={() => setFocusedInput(true)}
              onBlur={() => setFocusedInput(false)}
              onSubmitEditing={handleSearchUser}
              returnKeyType="search"
            />
            <TouchableOpacity
              style={[
                styles.searchButton,
                (searching || loading || !email.trim()) &&
                  styles.buttonDisabled,
              ]}
              onPress={handleSearchUser}
              disabled={searching || loading || !email.trim()}
              activeOpacity={0.8}
            >
              {searching ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Ionicons name="search" size={20} color={COLORS.white} />
              )}
            </TouchableOpacity>
          </View>
        </AnimatedView>

        {/* Results Area */}
        <AnimatedView layout={Layout.springify()}>
          {searchResults ? (
            <AnimatedView
              entering={ZoomIn.duration(400)}
              style={styles.userCard}
            >
              <View style={styles.userInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {searchResults.name.substring(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{searchResults.name}</Text>
                  {searchResults.username && (
                    <Text style={styles.userUsername}>
                      @{searchResults.username}
                    </Text>
                  )}
                  <Text style={styles.userEmail}>{searchResults.email}</Text>
                </View>
                <View style={styles.foundBadge}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={COLORS.success}
                  />
                </View>
              </View>

              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={[styles.btnOutline]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSearchResults(null);
                    setEmail("");
                  }}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Text style={styles.btnOutlineText}>Clear</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnPrimary, loading && styles.buttonDisabled]}
                  onPress={handleAddMember}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <>
                      <Text style={styles.btnPrimaryText}>Add Member</Text>
                      <Ionicons
                        name="arrow-forward"
                        size={18}
                        color={COLORS.white}
                        style={{ marginLeft: 6 }}
                      />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </AnimatedView>
          ) : (
            <AnimatedView
              entering={FadeInUp.duration(400).delay(300)}
              style={styles.emptyState}
            >
              <View style={styles.emptyStateIconBg}>
                <Ionicons
                  name={email ? "search-outline" : "people-outline"}
                  size={48}
                  color={email ? COLORS.primary : COLORS.gray}
                />
              </View>
              <Text style={styles.emptyStateTitle}>
                {email ? "Ready to search" : "Grow your group"}
              </Text>
              <Text style={styles.emptyStateText}>
                {email
                  ? "Tap the search button to find this user in our system."
                  : "Enter your friend's email or username above to add them to this group."}
              </Text>
            </AnimatedView>
          )}
        </AnimatedView>
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  containerWrapper: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    flexGrow: 1,
  },
  headerContainer: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 32,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: "#F0F0F0",
    borderRadius: 16,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  searchContainerFocused: {
    borderColor: COLORS.primary,
    shadowOpacity: 0.08,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.dark,
    paddingVertical: 12,
  },
  searchButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  userCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    backgroundColor: "#F8F9FA",
    padding: 16,
    borderRadius: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "bold",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 4,
  },
  userUsername: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "600",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.gray,
  },
  foundBadge: {
    padding: 4,
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 12,
  },
  btnPrimary: {
    flex: 2,
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnPrimaryText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  btnOutline: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnOutlineText: {
    color: COLORS.gray,
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
    paddingHorizontal: 20,
  },
  emptyStateIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: "center",
    lineHeight: 22,
  },
});
