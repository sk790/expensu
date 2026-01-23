import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Share,
} from "react-native";
import { groupService } from "../../services/authService";
import { COLORS } from "../../utils/constants";

export default function CreateGroupScreen({ navigation }) {
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert("Error", "Please enter a group name");
      return;
    }

    setLoading(true);
    try {
      const response = await groupService.createGroup(groupName.trim(), []);
      const inviteLink = response.inviteLink;

      Alert.alert("Success", "Group created successfully!", [
        {
          text: "Share Invite Link",
          onPress: () => shareInviteLink(inviteLink, groupName),
        },
        {
          text: "Done",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to create group"
      );
    } finally {
      setLoading(false);
    }
  };

  const shareInviteLink = async (inviteLink, groupName) => {
    try {
      await Share.share({
        message: `Join my group "${groupName}" on ExpenseSplitter!\n\n${inviteLink}`,
        title: `Join ${groupName}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.form}>
        <Text style={styles.label}>Group Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter group name (e.g., Goa Trip)"
          value={groupName}
          onChangeText={setGroupName}
          editable={!loading}
        />

        <Text style={styles.note}>
          After creating the group, you'll get a shareable invite link that you
          can send to others.
        </Text>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCreateGroup}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Creating..." : "Create Group"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    padding: 20,
  },
  form: {
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.light,
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: COLORS.light,
  },
  note: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 10,
    fontStyle: "italic",
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 30,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "bold",
  },
});
