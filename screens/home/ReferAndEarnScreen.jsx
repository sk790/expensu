import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import * as Clipboard from "expo-clipboard";
import { COLORS } from "../../utils/constants";

const ReferAndEarnScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const referralCode = user?.referralCode || "GETCODE";

  const onShare = async () => {
    try {
      await Share.share({
        message: `Join me on SplitMate! Use my referral code ${referralCode} and let's split expenses easily. Download now!`,
      });
    } catch (error) {
      console.log(error.message);
    }
  };

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Refer & Earn</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.illustrationContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="gift" size={80} color={COLORS.primary} />
          </View>
        </View>

        <Text style={styles.mainTitle}>Invite your friends</Text>
        <Text style={styles.description}>
          Share your referral code with friends and get ₹10 when they sign up on
          SplitMate!
        </Text>

        <View style={styles.stepsContainer}>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>Share your code with friends</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>They sign up using your code</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>You get ₹10 in your wallet!</Text>
          </View>
        </View>

        <View style={styles.codeContainer}>
          <Text style={styles.codeLabel}>YOUR REFERRAL CODE</Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{referralCode}</Text>
            <TouchableOpacity onPress={copyToClipboard} style={styles.copyButton}>
              <Ionicons
                name={copied ? "checkmark-circle" : "copy-outline"}
                size={24}
                color={copied ? "#10B981" : COLORS.primary}
              />
              <Text
                style={[
                  styles.copyText,
                  { color: copied ? "#10B981" : COLORS.primary },
                ]}
              >
                {copied ? "Copied!" : "Copy"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.shareButton} onPress={onShare}>
          <Text style={styles.shareButtonText}>Share Code</Text>
          <Ionicons
            name="share-social"
            size={20}
            color="#FFFFFF"
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F5FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.dark,
  },
  content: {
    padding: 24,
    alignItems: "center",
  },
  illustrationContainer: {
    marginTop: 12,
    marginBottom: 28,
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.primary + "20",
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.dark,
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
  },
  stepsContainer: {
    width: "100%",
    marginBottom: 40,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  stepNumberText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  stepText: {
    fontSize: 16,
    color: COLORS.dark,
    fontWeight: "500",
  },
  stepLine: {
    width: 2,
    height: 20,
    backgroundColor: COLORS.primary + "30",
    marginLeft: 15,
    marginVertical: 4,
  },
  codeContainer: {
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  codeLabel: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: "700",
    letterSpacing: 1.5,
    textAlign: "center",
    marginBottom: 16,
  },
  codeBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.primary + "50",
    borderStyle: "dashed",
  },
  codeText: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.dark,
    letterSpacing: 2,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  copyText: {
    color: COLORS.primary,
    fontWeight: "700",
    marginLeft: 6,
  },
  shareButton: {
    width: "100%",
    height: 60,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  shareButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
});

export default ReferAndEarnScreen;
