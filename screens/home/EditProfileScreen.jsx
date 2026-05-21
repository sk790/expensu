import React, { useState, useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../utils/constants";
import Animated, { FadeInDown } from "react-native-reanimated";
import AnimatedView from "../../components/AnimatedView";
import * as Haptics from "expo-haptics";
import { userService, uploadService } from "../../services/authService";
import { useAlert } from "../../hooks/useAlert";
import CustomAlert from "../../components/CustomAlert";
import { useAuth } from "../../context/AuthContext";
import * as ImagePicker from "expo-image-picker";

const InputField = ({ label, value, onChange, placeholder, icon }) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={styles.inputWrapper}>
      <Ionicons name={icon} size={20} color={COLORS.gray} style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={COLORS.gray}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  </View>
);


const AVATAR_OPTIONS = [
  { id: "avatar1", url: "https://api.dicebear.com/7.x/avataaars/png?seed=Felix" },
  { id: "avatar2", url: "https://api.dicebear.com/7.x/avataaars/png?seed=Aneka" },
  { id: "avatar3", url: "https://api.dicebear.com/7.x/avataaars/png?seed=James" },
  { id: "avatar4", url: "https://api.dicebear.com/7.x/avataaars/png?seed=Jasmine" },
  { id: "avatar6", url: "https://api.dicebear.com/7.x/avataaars/png?seed=Luna" },
  { id: "avatar7", url: "https://api.dicebear.com/7.x/avataaars/png?seed=Rocky" },
  { id: "avatar8", url: "https://api.dicebear.com/7.x/avataaars/png?seed=Bella" },
  { id: "avatar9", url: "https://api.dicebear.com/7.x/avataaars/png?seed=Jack" },
  { id: "avatar10", url: "https://api.dicebear.com/7.x/avataaars/png?seed=Milo" },
  { id: "avatar11", url: "https://api.dicebear.com/7.x/avataaars/png?seed=Sophie" },
  { id: "avatar12", url: "https://api.dicebear.com/7.x/avataaars/png?seed=Toby" },
  { id: "avatar13", url: "https://api.dicebear.com/7.x/avataaars/png?seed=Chloe" },
  { id: "avatar14", url: "https://api.dicebear.com/7.x/avataaars/png?seed=Oliver" },
  { id: "avatar15", url: "https://api.dicebear.com/7.x/avataaars/png?seed=Zoe" },
  { id: "avatar16", url: "https://api.dicebear.com/7.x/avataaars/png?seed=Max" },
  { id: "avatar17", url: "https://api.dicebear.com/7.x/avataaars/png?seed=Lily" },
];

export default function EditProfileScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { alertProps, showAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    avatar: "",
  });

  const { updateUser } = useAuth();

  const handlePickImage = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showAlert({
          type: "error",
          title: "Permission Denied",
          message: "We need access to your media library to upload a profile picture.",
        });
        return;
      }

      setPickerVisible(false);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const localUri = result.assets[0].uri;
        await uploadProfilePicture(localUri);
      }
    } catch (error) {
      console.error("Gallery picker error:", error);
      showAlert({
        type: "error",
        title: "Error",
        message: "Failed to open gallery.",
      });
    }
  };

  const handleTakePhoto = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        showAlert({
          type: "error",
          title: "Permission Denied",
          message: "We need access to your camera to take a profile picture.",
        });
        return;
      }

      setPickerVisible(false);

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const localUri = result.assets[0].uri;
        await uploadProfilePicture(localUri);
      }
    } catch (error) {
      console.error("Camera error:", error);
      showAlert({
        type: "error",
        title: "Error",
        message: "Failed to open camera.",
      });
    }
  };

  const uploadProfilePicture = async (localUri) => {
    setUploading(true);
    try {
      const response = await uploadService.uploadImage(localUri, "avatars");
      if (response.success && response.url) {
        setFormData((prev) => ({ ...prev, avatar: response.url }));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        throw new Error("Failed to get image URL from response.");
      }
    } catch (error) {
      console.error("Upload avatar failed:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert({
        type: "error",
        title: "Upload Failed",
        message: "Failed to upload image. Please try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (route.params?.user) {
      setFormData({
        name: route.params.user.name || "",
        username: route.params.user.username || "",
        avatar: route.params.user.avatar || "",
      });
    }
  }, []);

  const handleUpdate = async () => {
    if (!formData.name.trim() || !formData.username.trim()) {
      showAlert({
        type: "error",
        title: "Missing Info",
        message: "Please fill in all fields.",
      });
      return;
    }

    setLoading(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const response = await userService.updateProfile(formData);
      
      // Update global context state immediately
      if (response.user) {
        updateUser(response.user);
      }
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert({
        type: "success",
        title: "Success!",
        message: "Your profile has been updated successfully.",
        buttons: [{ text: "Great", onPress: () => navigation.goBack() }]
      });
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert({
        type: "error",
        title: "Update Failed",
        message: error.response?.data?.message || "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F5FA" translucent />
      <CustomAlert {...alertProps} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity 
          style={styles.backBtn} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          >
            <AnimatedView entering={FadeInDown.duration(400).delay(100)}>
              <View style={styles.avatarSection}>
                <TouchableOpacity 
                  style={[styles.avatarCircle, uploading && styles.avatarCircleDisabled]}
                  onPress={() => {
                    if (uploading) return;
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setPickerVisible(true);
                  }}
                  activeOpacity={uploading ? 1 : 0.9}
                  disabled={uploading}
                >
                  {formData.avatar ? (
                    <Image source={{ uri: formData.avatar }} style={[styles.avatarImage, uploading && { opacity: 0.5 }]} />
                  ) : (
                    <Text style={styles.avatarText}>
                      {formData.name ? formData.name.substring(0, 2).toUpperCase() : "U"}
                    </Text>
                  )}
                  {uploading ? (
                    <View style={styles.uploadingOverlay}>
                      <ActivityIndicator size="small" color="#FFF" />
                    </View>
                  ) : (
                    <View style={styles.editBadge}>
                      <Ionicons name="pencil" size={14} color="#FFF" />
                    </View>
                  )}
                </TouchableOpacity>
                <Text style={styles.avatarHint}>
                  {uploading ? "Uploading profile picture..." : "Tap to change avatar"}
                </Text>
              </View>

              <View style={styles.card}>
                <InputField
                  label="Full Name"
                  icon="person-outline"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(val) => setFormData({ ...formData, name: val })}
                />
                <View style={styles.divider} />
                <InputField
                  label="Username"
                  icon="at-outline"
                  placeholder="Enter unique username"
                  value={formData.username}
                  onChange={(val) => setFormData({ ...formData, username: val })}
                />
              </View>

              <TouchableOpacity 
                style={[styles.saveBtn, loading && styles.btnDisabled]} 
                onPress={handleUpdate}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </AnimatedView>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Avatar Picker Modal */}
      <Modal
        visible={pickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setPickerVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Choose Profile Photo</Text>
                  <TouchableOpacity onPress={() => setPickerVisible(false)}>
                    <Ionicons name="close" size={24} color={COLORS.dark} />
                  </TouchableOpacity>
                </View>

                {/* Upload Action Row */}
                <View style={styles.uploadSection}>
                  <TouchableOpacity 
                    style={styles.uploadButton} 
                    onPress={handlePickImage}
                  >
                    <View style={[styles.uploadIconContainer, { backgroundColor: COLORS.primary + "15" }]}>
                      <Ionicons name="image-outline" size={20} color={COLORS.primary} />
                    </View>
                    <Text style={styles.uploadButtonText}>Gallery</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.uploadButton} 
                    onPress={handleTakePhoto}
                  >
                    <View style={[styles.uploadIconContainer, { backgroundColor: COLORS.secondary + "15" }]}>
                      <Ionicons name="camera-outline" size={20} color={COLORS.secondary} />
                    </View>
                    <Text style={styles.uploadButtonText}>Camera</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR SELECT AN AVATAR</Text>
                  <View style={styles.dividerLine} />
                </View>
                
                <ScrollView contentContainerStyle={styles.avatarGrid} showsVerticalScrollIndicator={false}>
                  {AVATAR_OPTIONS.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.gridAvatarCircle,
                        formData.avatar === item.url && styles.selectedGridAvatarCircle
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setFormData({ ...formData, avatar: item.url });
                        setPickerVisible(false);
                      }}
                    >
                      <Image source={{ uri: item.url }} style={styles.gridAvatarImage} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F4F5FA" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 15,
    backgroundColor: "#F4F5FA",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.dark,
  },
  scrollContent: {
    padding: 20,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    position: "relative",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFF",
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.secondary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#F4F5FA",
  },
  avatarHint: {
    fontSize: 13,
    color: COLORS.gray,
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    paddingVertical: 8,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.gray,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9F9FB",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.dark,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginHorizontal: 16,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.dark,
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    gap: 16,
    paddingVertical: 10,
  },
  gridAvatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: "#EAEAEA",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9F9FB",
  },
  selectedGridAvatarCircle: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "08",
  },
  gridAvatarImage: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  uploadSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8,
  },
  uploadButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9F9FB",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  uploadIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.dark,
    flex: 1,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#EAEAEA",
  },
  dividerText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.gray,
    marginHorizontal: 12,
    letterSpacing: 1,
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarCircleDisabled: {
    opacity: 0.9,
  },
});
