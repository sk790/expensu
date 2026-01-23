import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { groupService } from "../../services/authService";
import { COLORS } from "../../utils/constants";

export default function JoinGroupScreen({ route, navigation }) {
  const { inviteCode } = route.params;
  const [groupInfo, setGroupInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    fetchGroupInfo();
  }, [inviteCode]);

  const fetchGroupInfo = async () => {
    try {
      const response = await groupService.getGroupByInvite(inviteCode);
      setGroupInfo(response.data);
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Invalid invite link",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    setJoining(true);
    try {
      const response = await groupService.joinGroupByInvite(inviteCode);
      Alert.alert("Success", "You've joined the group!", [
        {
          text: "OK",
          onPress: () =>
            navigation.replace("GroupDetail", {
              groupId: response.data._id,
            }),
        },
      ]);
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to join group"
      );
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Join Group</Text>

        <View style={styles.groupCard}>
          <Text style={styles.groupName}>{groupInfo.name}</Text>
          <Text style={styles.groupInfo}>
            Created by: {groupInfo.createdBy.name}
          </Text>
          <Text style={styles.groupInfo}>
            {groupInfo.memberCount}{" "}
            {groupInfo.memberCount === 1 ? "member" : "members"}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, joining && styles.buttonDisabled]}
          onPress={handleJoinGroup}
          disabled={joining}
        >
          <Text style={styles.buttonText}>
            {joining ? "Joining..." : "Join Group"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={joining}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 30,
    textAlign: "center",
  },
  groupCard: {
    backgroundColor: COLORS.light,
    padding: 25,
    borderRadius: 12,
    marginBottom: 30,
    alignItems: "center",
  },
  groupName: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 15,
  },
  groupInfo: {
    fontSize: 16,
    color: COLORS.gray,
    marginBottom: 5,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  cancelButton: {
    padding: 18,
    alignItems: "center",
  },
  cancelButtonText: {
    color: COLORS.gray,
    fontSize: 16,
  },
});
