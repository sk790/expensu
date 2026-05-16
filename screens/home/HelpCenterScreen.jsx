import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../../utils/constants";
import Animated, { FadeInDown, Layout } from "react-native-reanimated";
import AnimatedView from "../../components/AnimatedView";
import * as Haptics from "expo-haptics";

export default function HelpCenterScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");

  const categories = [
    { id: 1, title: "Getting Started", icon: "rocket-outline", color: "#4A90E2" },
    { id: 2, title: "Groups & Friends", icon: "people-outline", color: "#50E3C2" },
    { id: 3, title: "Expenses", icon: "cash-outline", color: "#F5A623" },
    { id: 4, title: "Account", icon: "person-outline", color: COLORS.primary },
  ];

  const faqs = [
    {
      question: "How do I create a group?",
      answer: "Tap the '+' button on the home screen, enter a name and description, and you're ready to add members!",
    },
    {
      question: "Can I edit an expense?",
      answer: "Yes, tap on any expense in the group list to view its details, then select the edit option.",
    },
    {
      question: "How do I settle my balance?",
      answer: "Go to the group details and tap on 'Settle Up'. The app will calculate who owes whom and provide the simplest way to clear debts.",
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We use end-to-end encryption for all your transaction data and never share your personal information.",
    },
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.gradientStart} translucent />
      
      {/* Header with Search */}
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help Center</Text>
          <View style={{ width: 40 }} />
        </View>

        <AnimatedView entering={FadeInDown.duration(500).delay(100)} style={styles.searchWrapper}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={COLORS.gray} />
            <TextInput
              style={styles.searchInput}
              placeholder="How can we help you?"
              placeholderTextColor={COLORS.gray}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </AnimatedView>
      </LinearGradient>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
      >
        {/* Categories */}
        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={styles.categoriesGrid}>
          {categories.map((cat, index) => (
            <AnimatedView 
              key={cat.id} 
              entering={FadeInDown.duration(400).delay(200 + index * 50)}
              style={styles.categoryCardWrapper}
            >
              <TouchableOpacity 
                style={styles.categoryCard}
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              >
                <View style={[styles.catIconBg, { backgroundColor: cat.color + "15" }]}>
                  <Ionicons name={cat.icon} size={28} color={cat.color} />
                </View>
                <Text style={styles.catTitle}>{cat.title}</Text>
              </TouchableOpacity>
            </AnimatedView>
          ))}
        </View>

        {/* Popular FAQs */}
        <Text style={styles.sectionTitle}>Popular Questions</Text>
        {faqs.map((faq, index) => (
          <AnimatedView 
            key={index} 
            entering={FadeInDown.duration(400).delay(400 + index * 50)}
            style={styles.faqCard}
          >
            <TouchableOpacity style={styles.faqHeader} activeOpacity={0.7}>
              <Text style={styles.faqQuestion}>{faq.question}</Text>
              <Ionicons name="chevron-down" size={18} color={COLORS.gray} />
            </TouchableOpacity>
            <Text style={styles.faqAnswer}>{faq.answer}</Text>
          </AnimatedView>
        ))}

        {/* Contact Support */}
        <AnimatedView entering={FadeInDown.duration(500).delay(700)}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            style={styles.supportCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.supportContent}>
              <Text style={styles.supportTitle}>Still need help?</Text>
              <Text style={styles.supportSubtitle}>Our support team is available 24/7</Text>
              <TouchableOpacity style={styles.supportBtn}>
                <Text style={styles.supportBtnText}>Contact Us</Text>
              </TouchableOpacity>
            </View>
            <Ionicons name="chatbubbles" size={80} color="rgba(255,255,255,0.2)" style={styles.supportIcon} />
          </LinearGradient>
        </AnimatedView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F4F5FA" },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFF",
  },
  searchWrapper: {
    width: "100%",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 54,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: COLORS.dark,
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.dark,
    marginTop: 10,
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  categoryCardWrapper: {
    width: "48%",
    marginBottom: 16,
  },
  categoryCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  catIconBg: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  catTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.dark,
    textAlign: "center",
  },
  faqCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.dark,
    flex: 1,
    marginRight: 10,
  },
  faqAnswer: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
    marginTop: 12,
  },
  supportCard: {
    marginTop: 20,
    borderRadius: 24,
    padding: 24,
    flexDirection: "row",
    overflow: "hidden",
  },
  supportContent: {
    flex: 1,
    zIndex: 1,
  },
  supportTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 4,
  },
  supportSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 20,
  },
  supportBtn: {
    backgroundColor: "#FFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  supportBtnText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 14,
  },
  supportIcon: {
    position: "absolute",
    right: -10,
    bottom: -10,
  },
});
