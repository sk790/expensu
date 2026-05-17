import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Share,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { groupService, userService } from "../../services/authService";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const { alertProps, showAlert } = useAlert();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 1) {
        performSearch(searchQuery.trim());
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = async (query) => {
    setSearching(true);
    try {
      const response = await userService.searchUserByEmail(query);
      if (response.user) {
        setSearchResults([response.user]);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const toggleMember = (user) => {
    const isSelected = selectedMembers.some((m) => m.id === user.id);
    if (isSelected) {
      setSelectedMembers(selectedMembers.filter((m) => m.id !== user.id));
    } else {
      setSelectedMembers([...selectedMembers, user]);
      setSearchQuery("");
      setSearchResults([]);
    }
  };

  const handleAction = async () => {
    if (!groupName.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert({
        type: "error",
        title: "Missing Name",
        message: "Please give your group a name.",
      });
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
        const memberIds = selectedMembers.map((m) => m.id);
        const response = await groupService.createGroup(
          groupName.trim(),
          memberIds,
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showAlert({
          type: "success",
          title: "Group Created! 🎉",
          message:
            selectedMembers.length > 0
              ? `"${groupName}" is ready. Invitations have been sent to your friends.`
              : `"${groupName}" is ready. Share the invite link with friends.`,
          buttons: [
            {
              text: "Share Invite",
              onPress: () =>
                Share.share({
                  message: `Join "${groupName}" on SplitMate!\n\n${response.inviteLink}`,
                }),
            },
            {
              text: "Done",
              style: "cancel",
              onPress: () => navigation.goBack(),
            },
          ],
        });
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert({
        type: "error",
        title: "Error",
        message:
          error.response?.data?.message ||
          `Failed to ${isEditing ? "update" : "create"} group`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 20}
    >
      <StatusBar barStyle="dark-content" />
      <CustomAlert {...alertProps} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <AnimatedView entering={FadeInDown.duration(400).delay(80)}>
          <View style={styles.heroSection}>
            <LinearGradient
              colors={[COLORS.gradientStart, COLORS.gradientEnd]}
              style={styles.iconCircle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons
                name={isEditing ? "create" : "people"}
                size={34}
                color="#FFF"
              />
            </LinearGradient>
            <Text style={styles.heroTitle}>
              {isEditing ? "Edit Group" : "Create a Group"}
            </Text>
            <Text style={styles.heroSubtitle}>
              {isEditing
                ? "Update your group details below"
                : "Start a shared space to track expenses with friends"}
            </Text>
          </View>
        </AnimatedView>

        <AnimatedView
          entering={FadeInDown.duration(400).delay(160)}
          style={styles.card}
        >
          <Text style={styles.inputLabel}>Group Name</Text>
          <View
            style={[
              styles.inputWrap,
              focused && { borderColor: COLORS.primary },
            ]}
          >
            <Ionicons
              name="people-outline"
              size={20}
              color={focused ? COLORS.primary : COLORS.gray}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="e.g. Goa Trip, Flat Mates..."
              placeholderTextColor="#999"
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

        {!isEditing && (
          <AnimatedView
            entering={FadeInDown.duration(400).delay(200)}
            style={styles.card}
          >
            <Text style={styles.inputLabel}>Add Members (Optional)</Text>
            <View style={styles.searchWrap}>
              <Ionicons
                name="search"
                size={18}
                color={COLORS.gray}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by email..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={handleSearch}
                autoCapitalize="none"
              />
              {searching && (
                <ActivityIndicator size="small" color={COLORS.primary} />
              )}
            </View>

            {searchResults.length > 0 && (
              <View style={styles.resultsList}>
                {searchResults.map((user) => (
                  <TouchableOpacity
                    key={user.id}
                    style={styles.resultItem}
                    onPress={() => toggleMember(user)}
                  >
                    <View style={styles.resultAvatar}>
                      <Text style={styles.resultAvatarText}>{user.name[0]}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.resultName}>{user.name}</Text>
                      <Text style={styles.resultEmail}>{user.email}</Text>
                    </View>
                    <Ionicons
                      name={
                        selectedMembers.some((m) => m.id === user.id)
                          ? "checkmark-circle"
                          : "add-circle-outline"
                      }
                      size={24}
                      color={COLORS.primary}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {selectedMembers.length > 0 && (
              <View style={styles.selectedList}>
                <Text style={styles.selectedTitle}>
                  Selected Members ({selectedMembers.length})
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.selectedScroll}
                >
                  {selectedMembers.map((member) => (
                    <View key={member.id} style={styles.selectedChip}>
                      <Text style={styles.chipText}>{member.name}</Text>
                      <TouchableOpacity onPress={() => toggleMember(member)}>
                        <Ionicons
                          name="close-circle"
                          size={18}
                          color={COLORS.gray}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </AnimatedView>
        )}

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
                  <Text style={styles.btnText}>
                    {isEditing ? "Save Changes" : "Create Group"}
                  </Text>
                  <Ionicons
                    name={isEditing ? "checkmark" : "arrow-forward"}
                    size={20}
                    color="#FFF"
                    style={{ marginLeft: 8 }}
                  />
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
  scroll: { padding: 24, paddingBottom: 120, flexGrow: 1 },

  heroSection: { alignItems: "center", marginBottom: 32, marginTop: 8 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.dark,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: "center",
    lineHeight: 20,
  },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.gray,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#EBEBF0",
    borderRadius: 14,
    backgroundColor: "#FAFAFE",
    overflow: "hidden",
  },
  inputIcon: { paddingHorizontal: 14 },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.dark,
    paddingVertical: 16,
    paddingRight: 16,
  },
  charCount: {
    fontSize: 12,
    color: COLORS.secondary,
    textAlign: "right",
    marginTop: 8,
  },

  btnWrapper: { borderRadius: 16, overflow: "hidden" },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
  },
  btnText: { color: "#FFF", fontSize: 17, fontWeight: "800" },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#EBEBF0",
    borderRadius: 14,
    backgroundColor: "#FAFAFE",
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.dark,
    paddingVertical: 12,
  },
  resultsList: {
    backgroundColor: "#F8F9FF",
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  resultAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + "20",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  resultAvatarText: { color: COLORS.primary, fontWeight: "bold" },
  resultName: { fontSize: 14, fontWeight: "700", color: COLORS.dark },
  resultEmail: { fontSize: 12, color: COLORS.gray },
  selectedList: { marginTop: 10 },
  selectedTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.gray,
    marginBottom: 10,
  },
  selectedScroll: { flexDirection: "row" },
  selectedChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F0FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  chipText: { fontSize: 13, color: COLORS.primary, fontWeight: "600" },
});
