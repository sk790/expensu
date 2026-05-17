import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../../utils/constants";
import Animated, { FadeInDown } from "react-native-reanimated";
import AnimatedView from "../../components/AnimatedView";

export default function TermsOfServiceScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const sections = [
    {
      title: "1. Acceptance of Terms",
      content:
        "By accessing and using SplitMate, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this app.",
    },
    {
      title: "2. Use License",
      content:
        "Permission is granted to temporarily download one copy of the materials (information or software) on SplitMate for personal, non-commercial transitory viewing only.",
    },
    {
      title: "3. User Accounts",
      content:
        "When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.",
    },
    {
      title: "4. Expense Splitting",
      content:
        "SplitMate is a tool for tracking and splitting expenses. While we strive for accuracy, we are not responsible for any financial disputes between users. All settlements are the sole responsibility of the users involved.",
    },
    {
      title: "5. Privacy Policy",
      content:
        "Your use of SplitMate is also governed by our Privacy Policy. Please review our Privacy Policy, which also governs the Site and informs users of our data collection practices.",
    },
    {
      title: "6. Limitations",
      content:
        "In no event shall SplitMate or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the app.",
    },
  ];

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F4F5FA"
        translucent
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 },
        ]}
      >
        <AnimatedView entering={FadeInDown.duration(400).delay(100)}>
          <View style={styles.heroSection}>
            <LinearGradient
              colors={[COLORS.gradientStart + "15", COLORS.gradientEnd + "15"]}
              style={styles.iconCircle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="document-text" size={40} color={COLORS.primary} />
            </LinearGradient>
            <Text style={styles.lastUpdated}>Last Updated: May 2026</Text>
            <Text style={styles.welcomeText}>
              Please read these terms carefully before using the SplitMate mobile
              application.
            </Text>
          </View>
        </AnimatedView>

        {sections.map((section, index) => (
          <AnimatedView
            key={index}
            entering={FadeInDown.duration(400).delay(200 + index * 50)}
            style={styles.sectionCard}
          >
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </AnimatedView>
        ))}

        <AnimatedView entering={FadeInDown.duration(400).delay(600)}>
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              If you have any questions about these Terms, please contact us at
              support@SplitMate.com
            </Text>
          </View>
        </AnimatedView>
      </ScrollView>
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
  heroSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  lastUpdated: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.gray,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 15,
    color: COLORS.dark,
    textAlign: "center",
    lineHeight: 22,
    opacity: 0.7,
  },
  sectionCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.dark,
    marginBottom: 10,
  },
  sectionContent: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 22,
  },
  footer: {
    marginTop: 20,
    padding: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 13,
    color: COLORS.gray,
    textAlign: "center",
    lineHeight: 20,
    fontStyle: "italic",
  },
});
