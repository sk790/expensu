import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated as RNAnimated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions, scanFromURLAsync } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { groupService } from "../../services/authService";
import { COLORS } from "../../utils/constants";
import Animated, { FadeInDown, FadeInUp, ZoomIn } from "react-native-reanimated";
import AnimatedView from "../../components/AnimatedView";
import * as Haptics from "expo-haptics";
import CustomAlert from "../../components/CustomAlert";
import { useAlert } from "../../hooks/useAlert";

const { width } = Dimensions.get("window");
const SCANNER_SIZE = width * 0.65;

export default function JoinGroupScreen({ route, navigation }) {
  const initialInviteCode = route.params?.inviteCode || "";
  const [inviteCode, setInviteCode] = useState(initialInviteCode);
  const [groupInfo, setGroupInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);

  // Tab state: "scan" or "manual"
  const [activeTab, setActiveTab] = useState(initialInviteCode ? "preview" : "scan");

  // Manual input state
  const [manualCode, setManualCode] = useState("");
  const [searchingCode, setSearchingCode] = useState(false);

  // Camera state
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [pickingImage, setPickingImage] = useState(false);
  const [laserAnim] = useState(new RNAnimated.Value(0));

  const { alertProps, showAlert } = useAlert();

  // Laser line animation
  useEffect(() => {
    if (activeTab === "scan" && permission?.granted && !scanned) {
      RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(laserAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          RNAnimated.timing(laserAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      laserAnim.setValue(0);
    }
  }, [activeTab, permission, scanned, laserAnim]);

  const translateY = laserAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCANNER_SIZE - 4],
  });

  // Automatically fetch group details if direct invite code is provided
  useEffect(() => {
    if (initialInviteCode) {
      fetchGroupInfo(initialInviteCode);
    }
  }, [initialInviteCode]);

  const fetchGroupInfo = async (codeToFetch) => {
    if (!codeToFetch) return;
    setLoading(true);
    try {
      const response = await groupService.getGroupByInvite(codeToFetch);
      setGroupInfo(response.data);
      setInviteCode(codeToFetch);
      setActiveTab("preview");
    } catch (error) {
      showAlert({
        type: "error",
        title: "Invalid Invite",
        message: error.response?.data?.message || "This invite link is invalid or has expired.",
        buttons: [
          {
            text: "OK",
            onPress: () => {
              if (initialInviteCode) {
                navigation.goBack();
              } else {
                setGroupInfo(null);
                setActiveTab("scan");
              }
            },
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async () => {
    const trimmedCode = manualCode.trim().toUpperCase();
    if (trimmedCode.length !== 6) {
      showAlert({
        type: "error",
        title: "Invalid Code",
        message: "Invite code must be exactly 6 characters long.",
      });
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSearchingCode(true);
    try {
      const response = await groupService.getGroupByInvite(trimmedCode);
      setGroupInfo(response.data);
      setInviteCode(trimmedCode);
      setActiveTab("preview");
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert({
        type: "error",
        title: "Group Not Found",
        message: error.response?.data?.message || "Invalid or expired invite code.",
      });
    } finally {
      setSearchingCode(false);
    }
  };

  const extractInviteCode = (scannedValue) => {
    if (!scannedValue) return "";
    if (scannedValue.startsWith("splitmate://join/")) {
      return scannedValue.replace("splitmate://join/", "").trim().toUpperCase();
    }
    if (scannedValue.includes("/invite/")) {
      const parts = scannedValue.split("/invite/");
      const code = parts[parts.length - 1].split(/[/?#]/)[0];
      return code.trim().toUpperCase();
    }
    return scannedValue.trim().toUpperCase();
  };

  const handleBarCodeScanned = ({ type, data }) => {
    if (scanned) return;
    setScanned(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const code = extractInviteCode(data);

    if (code && code.length === 6) {
      fetchGroupInfo(code);
    } else {
      showAlert({
        type: "error",
        title: "Invalid QR Code",
        message: "This QR code does not contain a valid SplitMate invite.",
        buttons: [{ text: "Try Again", onPress: () => setScanned(false) }],
      });
    }
  };

  const handlePickFromGallery = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled || !result.assets?.[0]?.uri) return;

      setPickingImage(true);
      const uri = result.assets[0].uri;

      const scanResults = await scanFromURLAsync(uri, ["qr"]);

      if (!scanResults || scanResults.length === 0) {
        showAlert({
          type: "error",
          title: "No QR Found",
          message: "Could not find a QR code in the selected image. Please try a clearer image.",
        });
        return;
      }

      const code = extractInviteCode(scanResults[0].data);
      if (code && code.length === 6) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        fetchGroupInfo(code);
      } else {
        showAlert({
          type: "error",
          title: "Invalid QR Code",
          message: "This QR code does not contain a valid SplitMate invite.",
        });
      }
    } catch (err) {
      showAlert({
        type: "error",
        title: "Error",
        message: "Failed to read QR from image. Please try again.",
      });
    } finally {
      setPickingImage(false);
    }
  };

  const handleJoinGroup = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setJoining(true);
    try {
      const response = await groupService.joinGroupByInviteCode(inviteCode);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert({
        type: "success",
        title: "You're In! 🎉",
        message: `Welcome to ${groupInfo?.name || "the group"}`,
        buttons: [
          {
            text: "Let's Go",
            onPress: () => navigation.replace("GroupDetails", { groupId: response.data._id }),
          },
        ],
      });
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert({
        type: "error",
        title: "Error",
        message: error.response?.data?.message || "Failed to join group",
      });
    } finally {
      setJoining(false);
    }
  };

  const switchTab = (tab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
    setScanned(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Looking up invite...</Text>
      </View>
    );
  }

  // Preview Mode
  if (activeTab === "preview") {
    return (
      <View style={styles.container}>
        <CustomAlert {...alertProps} />
        <View style={styles.content}>
          <AnimatedView entering={FadeInDown.duration(500).delay(100)} style={styles.heroSection}>
            <View style={styles.iconCircle}>
              <Ionicons name="link" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.title}>You've been invited!</Text>
            <Text style={styles.subtitle}>Join a group and start splitting expenses</Text>
          </AnimatedView>

          {groupInfo && (
            <AnimatedView entering={ZoomIn.duration(400).delay(300)} style={styles.groupCard}>
              <View style={styles.groupAvatarLarge}>
                <Text style={styles.groupAvatarText}>{groupInfo.name.substring(0, 2).toUpperCase()}</Text>
              </View>
              <Text style={styles.groupName}>{groupInfo.name}</Text>
              <View style={styles.groupMeta}>
                <View style={styles.metaPill}>
                  <Ionicons name="person-outline" size={14} color={COLORS.primary} />
                  <Text style={styles.metaText}>Created by {groupInfo.createdBy?.name || "Admin"}</Text>
                </View>
                <View style={styles.metaPill}>
                  <Ionicons name="people-outline" size={14} color={COLORS.primary} />
                  <Text style={styles.metaText}>
                    {groupInfo.memberCount} {groupInfo.memberCount === 1 ? "member" : "members"}
                  </Text>
                </View>
              </View>
            </AnimatedView>
          )}

          <AnimatedView entering={FadeInUp.duration(500).delay(500)}>
            <TouchableOpacity
              style={[styles.joinButton, joining && styles.buttonDisabled]}
              onPress={handleJoinGroup}
              disabled={joining}
              activeOpacity={0.85}
            >
              {joining ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Text style={styles.joinButtonText}>Join Group</Text>
                  <Ionicons name="arrow-forward" size={20} color={COLORS.white} style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (initialInviteCode) {
                  navigation.goBack();
                } else {
                  setGroupInfo(null);
                  setActiveTab("scan");
                }
              }}
              disabled={joining}
            >
              <Text style={styles.cancelButtonText}>Back</Text>
            </TouchableOpacity>
          </AnimatedView>
        </View>
      </View>
    );
  }

  // Scanning / Manual Code Input Modes
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <CustomAlert {...alertProps} />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerSpacer} />

        {/* Tab Selection */}
        <AnimatedView entering={FadeInDown.duration(400)} style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "scan" && styles.activeTab]}
            onPress={() => switchTab("scan")}
            activeOpacity={0.8}
          >
            <Ionicons
              name="scan-outline"
              size={18}
              color={activeTab === "scan" ? COLORS.white : COLORS.gray}
            />
            <Text style={[styles.tabText, activeTab === "scan" && styles.activeTabText]}>
              Scan QR
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "manual" && styles.activeTab]}
            onPress={() => switchTab("manual")}
            activeOpacity={0.8}
          >
            <Ionicons
              name="keypad-outline"
              size={18}
              color={activeTab === "manual" ? COLORS.white : COLORS.gray}
            />
            <Text style={[styles.tabText, activeTab === "manual" && styles.activeTabText]}>
              Enter Code
            </Text>
          </TouchableOpacity>
        </AnimatedView>

        {/* Scan Mode View */}
        {activeTab === "scan" && (
          <AnimatedView entering={FadeInUp.duration(400)} style={styles.modeContainer}>
            <Text style={styles.instructionTitle}>Scan Group QR Code</Text>
            <Text style={styles.instructionSubtitle}>
              Position the QR code inside the frame to join the group instantly.
            </Text>

            {!permission ? (
              <View style={styles.cameraPlaceholder}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.permissionText}>Loading camera...</Text>
              </View>
            ) : !permission.granted ? (
              <View style={styles.permissionCard}>
                <View style={styles.permissionIconCircle}>
                  <Ionicons name="camera-outline" size={36} color={COLORS.primary} />
                </View>
                <Text style={styles.permissionTitle}>Camera Access Required</Text>
                <Text style={styles.permissionDesc}>
                  We need your permission to use the camera to scan QR codes.
                </Text>
                <TouchableOpacity
                  style={styles.permissionBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    requestPermission();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.permissionBtnText}>Enable Camera</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.cameraContainer}>
                <CameraView
                  style={styles.camera}
                  barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                  }}
                  onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                >
                  {/* Scanner Mask */}
                  <View style={styles.overlay}>
                    <View style={styles.overlayRow} />
                    <View style={styles.overlayMiddleRow}>
                      <View style={styles.overlaySide} />
                      <View style={styles.cutout}>
                        {/* Animated Laser line */}
                        <RNAnimated.View
                          style={[
                            styles.laserLine,
                            { transform: [{ translateY: translateY }] },
                          ]}
                        />
                        {/* Corner markers */}
                        <View style={[styles.corner, styles.topLeft]} />
                        <View style={[styles.corner, styles.topRight]} />
                        <View style={[styles.corner, styles.bottomLeft]} />
                        <View style={[styles.corner, styles.bottomRight]} />
                      </View>
                      <View style={styles.overlaySide} />
                    </View>
                    <View style={styles.overlayRow} />
                  </View>
                </CameraView>
              </View>
            )}

            {/* Gallery Upload Button — shown below scanner always */}
            <TouchableOpacity
              style={styles.galleryBtn}
              onPress={handlePickFromGallery}
              disabled={pickingImage}
              activeOpacity={0.8}
            >
              {pickingImage ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Ionicons name="image-outline" size={20} color={COLORS.primary} />
              )}
              <Text style={styles.galleryBtnText}>
                {pickingImage ? "Reading QR..." : "Choose QR from Gallery"}
              </Text>
            </TouchableOpacity>
          </AnimatedView>
        )}

        {/* Enter Code Mode View */}
        {activeTab === "manual" && (
          <AnimatedView entering={FadeInUp.duration(400)} style={styles.modeContainer}>
            <Text style={styles.instructionTitle}>Enter Invite Code</Text>
            <Text style={styles.instructionSubtitle}>
              Type the 6-character uppercase code to preview and join the group.
            </Text>

            <View style={styles.inputCard}>
              <TextInput
                style={styles.codeInput}
                placeholder="ABCDEF"
                placeholderTextColor={COLORS.gray + "50"}
                value={manualCode}
                onChangeText={(text) => setManualCode(text.toUpperCase())}
                maxLength={6}
                autoFocus
                autoCapitalize="characters"
                autoCorrect={false}
                spellCheck={false}
              />
              <Text style={styles.codeHint}>Code is not case-sensitive</Text>

              <TouchableOpacity
                style={[
                  styles.lookupButton,
                  (manualCode.length !== 6 || searchingCode) && styles.buttonDisabled,
                ]}
                onPress={handleManualSubmit}
                disabled={manualCode.length !== 6 || searchingCode}
                activeOpacity={0.85}
              >
                {searchingCode ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Text style={styles.lookupButtonText}>Lookup Group</Text>
                    <Ionicons name="search" size={18} color={COLORS.white} style={{ marginLeft: 6 }} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </AnimatedView>
        )}

        <TouchableOpacity
          style={styles.backButtonBottom}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.goBack();
          }}
        >
          <Text style={styles.backButtonTextBottom}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  scrollContainer: { flexGrow: 1, padding: 24, alignItems: "center" },
  headerSpacer: { height: 10 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8F9FA", gap: 16 },
  loadingText: { fontSize: 15, color: COLORS.gray, fontWeight: "500" },
  content: { flex: 1, padding: 24, justifyContent: "center" },
  heroSection: { alignItems: "center", marginBottom: 28 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary + "15", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  title: { fontSize: 26, fontWeight: "bold", color: COLORS.dark, marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 15, color: COLORS.gray, textAlign: "center", lineHeight: 22 },
  groupCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 28, marginBottom: 32, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.07, shadowRadius: 16, elevation: 4 },
  groupAvatarLarge: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primary + "20", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  groupAvatarText: { fontSize: 26, fontWeight: "bold", color: COLORS.primary },
  groupName: { fontSize: 22, fontWeight: "bold", color: COLORS.dark, marginBottom: 16, textAlign: "center" },
  groupMeta: { flexDirection: "row", gap: 10, flexWrap: "wrap", justifyContent: "center" },
  metaPill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: COLORS.primary + "10", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  metaText: { fontSize: 13, color: COLORS.primary, fontWeight: "500" },
  joinButton: { backgroundColor: COLORS.primary, flexDirection: "row", paddingVertical: 18, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 14, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  buttonDisabled: { opacity: 0.5 },
  joinButtonText: { color: COLORS.white, fontSize: 18, fontWeight: "bold" },
  cancelButton: { paddingVertical: 14, alignItems: "center" },
  cancelButtonText: { color: COLORS.gray, fontSize: 16, fontWeight: "600" },

  // Scan & manual entry designs
  tabContainer: { flexDirection: "row", backgroundColor: "#E2E8F0", borderRadius: 16, padding: 4, width: "100%", marginBottom: 32 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 12, gap: 8 },
  activeTab: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 15, fontWeight: "600", color: COLORS.gray },
  activeTabText: { color: COLORS.white },

  modeContainer: { width: "100%", alignItems: "center" },
  instructionTitle: { fontSize: 20, fontWeight: "700", color: COLORS.dark, marginBottom: 8, textAlign: "center" },
  instructionSubtitle: { fontSize: 14, color: COLORS.gray, textAlign: "center", marginBottom: 28, paddingHorizontal: 16, lineHeight: 20 },

  cameraPlaceholder: { width: "100%", height: SCANNER_SIZE * 1.3, borderRadius: 24, backgroundColor: "#E2E8F0", justifyContent: "center", alignItems: "center" },
  permissionText: { fontSize: 14, color: COLORS.gray, marginTop: 12 },

  permissionCard: { backgroundColor: COLORS.white, borderRadius: 24, padding: 32, alignItems: "center", width: "100%", shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 4 },
  permissionIconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primary + "12", justifyContent: "center", alignItems: "center", marginBottom: 18 },
  permissionTitle: { fontSize: 18, fontWeight: "700", color: COLORS.dark, marginBottom: 8 },
  permissionDesc: { fontSize: 14, color: COLORS.gray, textAlign: "center", marginBottom: 24, lineHeight: 20 },
  permissionBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  permissionBtnText: { color: COLORS.white, fontSize: 15, fontWeight: "700" },

  cameraContainer: { width: "100%", height: SCANNER_SIZE * 1.3, borderRadius: 24, overflow: "hidden", backgroundColor: "#000", shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 8 },
  camera: { flex: 1 },

  // QR overlay mask
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  overlayRow: { flex: 1 },
  overlayMiddleRow: { flexDirection: "row", height: SCANNER_SIZE },
  overlaySide: { flex: 1 },
  cutout: { width: SCANNER_SIZE, height: SCANNER_SIZE, position: "relative", backgroundColor: "transparent" },
  laserLine: { position: "absolute", left: 2, right: 2, height: 3, backgroundColor: "#00FF66", shadowColor: "#00FF66", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4 },
  
  // Custom scanner corner styles
  corner: { position: "absolute", width: 24, height: 24, borderColor: "#00FF66" },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 12 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 12 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 12 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 12 },

  // Manual entry card
  inputCard: { backgroundColor: COLORS.white, borderRadius: 24, padding: 32, alignItems: "center", width: "100%", shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 4 },
  codeInput: { width: "100%", height: 72, backgroundColor: "#F1F5F9", borderRadius: 16, borderFocusColor: COLORS.primary, borderWidth: 1.5, borderColor: "#E2E8F0", textAlign: "center", fontSize: 28, fontWeight: "800", color: COLORS.dark, letterSpacing: 8, paddingLeft: 8 },
  codeHint: { fontSize: 13, color: COLORS.gray, marginTop: 12, marginBottom: 24 },
  lookupButton: { backgroundColor: COLORS.primary, flexDirection: "row", paddingVertical: 16, borderRadius: 16, alignItems: "center", justifyContent: "center", width: "100%", shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 6 },
  lookupButtonText: { color: COLORS.white, fontSize: 16, fontWeight: "bold" },
  
  backButtonBottom: { marginTop: 24, paddingVertical: 12, paddingHorizontal: 24 },
  backButtonTextBottom: { color: COLORS.gray, fontSize: 15, fontWeight: "600" },

  galleryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primary + "40",
    backgroundColor: COLORS.primary + "08",
    width: "100%",
  },
  galleryBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.primary,
  },
});
