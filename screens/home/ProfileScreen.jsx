import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useAuth } from "../../context/AuthContext";
import { userService } from "../../services/authService";
import { COLORS } from "../../utils/constants";
import { storage } from "../../utils/storage";

export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      setLoading(true);
      const data = await userService.getUserProfile();
      if (data.user) {
        setUser(data.user);
        // Update local storage with fresh data
        await storage.setUser(data.user);
      } else {
        setUser(data);
      }
    } catch (error) {
      console.log("Error fetching profile:", error);
      // Fallback to local storage
      const localUser = await storage.getUser();
      setUser(localUser);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", onPress: logout, style: "destructive" },
    ]);
  };

  if (!user) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {user.name ? user.name.charAt(0).toUpperCase() : "U"}
          </Text>
        </View>
        <Text style={styles.name}>{user.name}</Text>
        {user.username && <Text style={styles.username}>@{user.username}</Text>}
        <Text style={styles.email}>{user.email}</Text>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <View style={styles.menuIconContainer}>
            <Icon name="logout" size={24} color="#ff6b6b" />
          </View>
          <Text style={[styles.menuText, { color: "#ff6b6b" }]}>Logout</Text>
          <Icon name="chevron-right" size={24} color={COLORS.gray} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  header: {
    backgroundColor: COLORS.white,
    padding: 30,
    alignItems: "center",
    marginBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "bold",
    color: COLORS.white,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 5,
  },
  username: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: COLORS.gray,
  },
  menuContainer: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    borderRadius: 15,
    paddingVertical: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  menuIconContainer: {
    width: 40,
    alignItems: "center",
    marginRight: 10,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.dark,
  },
});
