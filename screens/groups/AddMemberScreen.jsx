import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { groupService, userService } from "../../services/authService";
import { COLORS } from "../../utils/constants";

export default function AddMemberScreen({ route, navigation }) {
  const { groupId, currentMembers } = route.params;
  //   console.log(groupId,currentMembers);

  const [email, setEmail] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const handleSearchUser = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter an email address");
      return;
    }

    setSearching(true);
    try {
      const response = await userService.searchUserByEmail(email.trim());
      console.log(response, "user");

      // Check if user is already a member
      const isAlreadyMember = currentMembers.some(
        (member) => member._id === response.user._id,
      );
      console.log(isAlreadyMember, "al");

      if (isAlreadyMember) {
        Alert.alert("Info", "This user is already a member of the group");
        setSearchResults(null);
        return;
      }

      setSearchResults(response.user);
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "User not found");
      setSearchResults(null);
    } finally {
      setSearching(false);
    }
  };

  const handleAddMember = async () => {
    console.log(searchResults, "search");

    if (!searchResults) {
      Alert.alert("Error", "Please search for a user first");
      return;
    }

    setLoading(true);
    try {
      console.log(groupId, searchResults._id, "groupId");

      const res = await groupService.addMemberToGroup(
        groupId,
        searchResults._id,
      );
      console.log(res, "res");

      Alert.alert(
        "Success",
        `${searchResults.name} has been added to the group!`,
        [
          {
            text: "OK",
            onPress: () => {
              setEmail("");
              setSearchResults(null);
              navigation.goBack();
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to add member",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.form}>
        <Text style={styles.label}>Friend's Email</Text>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter friend's email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading && !searching}
          />
          <TouchableOpacity
            style={[
              styles.searchButton,
              (searching || loading) && styles.buttonDisabled,
            ]}
            onPress={handleSearchUser}
            disabled={searching || loading}
          >
            {searching ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Icon name="search" size={24} color={COLORS.white} />
            )}
          </TouchableOpacity>
        </View>

        {searchResults && (
          <View style={styles.userCard}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {searchResults.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{searchResults.name}</Text>
                <Text style={styles.userEmail}>{searchResults.email}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonPrimary,
                loading && styles.buttonDisabled,
              ]}
              onPress={handleAddMember}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Adding..." : "Add Member"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={() => {
                setSearchResults(null);
                setEmail("");
              }}
              disabled={loading}
            >
              <Text style={styles.buttonSecondaryText}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}

        {!searchResults && email && !searching && (
          <View style={styles.emptyState}>
            <Icon name="search" size={50} color={COLORS.gray} />
            <Text style={styles.emptyStateText}>
              Click the search button to find your friend
            </Text>
          </View>
        )}

        {!searchResults && !email && !searching && (
          <View style={styles.emptyState}>
            <Icon name="person-add" size={50} color={COLORS.gray} />
            <Text style={styles.emptyStateText}>
              Enter your friend's email to add them to the group
            </Text>
          </View>
        )}
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
    marginTop: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.light,
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: COLORS.light,
  },
  searchButton: {
    width: 50,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  userCard: {
    backgroundColor: COLORS.light,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "bold",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.dark,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 5,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonPrimary: {
    backgroundColor: COLORS.primary,
  },
  buttonSecondary: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonSecondaryText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyState: {
    alignItems: "center",
    marginTop: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.gray,
    marginTop: 15,
    textAlign: "center",
  },
});
