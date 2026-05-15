import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, { FadeInDown, Layout, ZoomIn } from "react-native-reanimated";
import AnimatedView from "../../components/AnimatedView";
import CustomAlert from "../../components/CustomAlert";
import GroupCard from "../../components/GroupCard";
import { useAuth } from "../../context/AuthContext";
import { useAlert } from "../../hooks/useAlert";
import { groupService } from "../../services/authService";
import { COLORS } from "../../utils/constants";

export default function GroupsListScreen({ navigation }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { logout } = useAuth();
  const { alertProps, showAlert } = useAlert();

  const fetchGroups = async () => {
    try {
      const response = await groupService.getUserGroups();
      setGroups(response.data);
    } catch (error) {
      showAlert({
        type: "error",
        title: "Error",
        message: "Failed to fetch groups",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            showAlert({
              type: "confirm",
              title: "Logout",
              message: "Are you sure you want to logout?",
              buttons: [
                { text: "Cancel", style: "cancel" },
                { text: "Logout", style: "destructive", onPress: logout },
              ],
            });
          }}
        >
          <Ionicons name="log-out-outline" size={24} color={COLORS.danger} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, logout]);

  useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchGroups();
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
      <CustomAlert {...alertProps} />
      <FlatList
        data={groups}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          groups.length === 0 ? styles.emptyList : styles.listContent
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        renderItem={({ item, index }) => (
          <AnimatedView
            entering={FadeInDown.duration(350).delay(index * 60)}
            layout={Layout.springify()}
          >
            <GroupCard
              group={item}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate("GroupDetails", { groupId: item._id });
              }}
            />
          </AnimatedView>
        )}
        ListEmptyComponent={
          <AnimatedView
            entering={FadeInDown.duration(500)}
            style={styles.emptyContainer}
          >
            <View style={styles.emptyIconCircle}>
              <Ionicons
                name="people-outline"
                size={56}
                color={COLORS.primary}
              />
            </View>
            <Text style={styles.emptyText}>No groups yet</Text>
            <Text style={styles.emptySubtext}>
              Tap + to create your first group and start splitting expenses
            </Text>
          </AnimatedView>
        }
      />

      <AnimatedView
        entering={ZoomIn.duration(400).delay(300)}
        style={styles.fabContainer}
      >
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            navigation.navigate("CreateGroup");
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={30} color={COLORS.white} />
        </TouchableOpacity>
      </AnimatedView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  listContent: { padding: 16, paddingBottom: 100 },
  headerButton: { marginRight: 16 },
  emptyList: { flexGrow: 1, justifyContent: "center" },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 15,
    color: COLORS.gray,
    textAlign: "center",
    lineHeight: 22,
  },
  fabContainer: { position: "absolute", right: 20, bottom: 30 },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
