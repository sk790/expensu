import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useFocusEffect } from "@react-navigation/native";
import { groupService } from "../../services/authService";
import { COLORS } from "../../utils/constants";
import GroupCard from "../../components/GroupCard";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useAuth } from "../../context/AuthContext";

export default function GroupsListScreen({ navigation }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { logout } = useAuth();

  const fetchGroups = async () => {
    try {
      const response = await groupService.getUserGroups();
      setGroups(response.data);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch groups");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {
            Alert.alert("Logout", "Are you sure you want to logout?", [
              { text: "Cancel", style: "cancel" },
              { text: "Logout", onPress: logout, style: "destructive" },
            ]);
          }}
        >
          <Icon name="logout" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, logout]);

  useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchGroups();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={groups}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <GroupCard
            group={item}
            onPress={() =>
              // navigation.navigate("GroupDetails", { groupId: item._id })
              navigation.navigate("GroupDetails", { groupId: item._id })
            }
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="group" size={80} color={COLORS.gray} />
            <Text style={styles.emptyText}>No groups yet</Text>
            <Text style={styles.emptySubtext}>
              Create a group to get started
            </Text>
          </View>
        }
        contentContainerStyle={groups.length === 0 ? styles.emptyList : null}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("CreateGroup")}
      >
        <Icon name="add" size={30} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  headerButton: {
    marginRight: 15,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.dark,
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 16,
    color: COLORS.gray,
    marginTop: 5,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
