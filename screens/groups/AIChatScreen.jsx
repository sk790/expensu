import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  Dimensions,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
  SlideInRight,
  ZoomIn,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { COLORS, SHADOWS } from "../../utils/constants";
import { aiService } from "../../services/authService";

const { width } = Dimensions.get("window");

const SUGGESTIONS = [
  { id: "1", text: "Who owes me the most money? 💸", prompt: "Who owes me the most money?" },
  { id: "2", text: "Draft a funny payment reminder 😜", prompt: "Draft a funny payment reminder for Rahul for ₹350" },
  { id: "3", text: "What are our recent group expenses? 📊", prompt: "What are our recent group expenses?" },
  { id: "4", text: "Give me some budgeting tips 💡", prompt: "Give me some budgeting tips based on my spendings" },
];

export default function AIChatScreen() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content: "👋 Hi! I am your **Expensu AI Assistant**.\n\nI can analyze your shared expenses, track group balances, draft polite payment reminders, and offer personalized financial insights. What can I do for you today?",
      createdAt: new Date(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);

  // Auto-scroll to bottom of conversation
  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const activeText = textToSend || message;
    if (!activeText.trim() || loading) return;

    // Trigger haptics
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMsg = {
      id: Date.now().toString(),
      role: "user",
      content: activeText,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setMessage("");
    setLoading(true);

    try {
      // Prepare history to send to backend (excluding welcome message)
      const chatHistory = messages
        .filter((msg) => msg.id !== "welcome")
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      const response = await aiService.chat(activeText, chatHistory);

      if (response.success && response.data) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: response.data,
            createdAt: new Date(),
          },
        ]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        throw new Error("Invalid server response");
      }
    } catch (error) {
      console.error("AI Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "❌ Sorry, I encountered an error connecting to the server. Please check your internet connection or make sure the GEMINI_API_KEY is configured in the backend `.env` file.",
          createdAt: new Date(),
        },
      ]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionPress = (prompt) => {
    handleSend(prompt);
  };

  const clearChat = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "👋 Hi! I am your **Expensu AI Assistant**.\n\nI can analyze your shared expenses, track group balances, draft polite payment reminders, and offer personalized financial insights. What can I do for you today?",
        createdAt: new Date(),
      },
    ]);
  };

  // Basic custom markdown formatter for React Native Text components
  const renderFormattedContent = (content) => {
    const lines = content.split("\n");
    return lines.map((line, index) => {
      // 1. Identify quotes
      if (line.trim().startsWith(">")) {
        const text = line.replace(">", "").trim();
        return (
          <View key={index} style={styles.quoteBlock}>
            <Text style={styles.quoteText}>{parseBoldText(text)}</Text>
          </View>
        );
      }

      // 2. Identify list items (bullet points)
      if (line.trim().startsWith("*") || line.trim().startsWith("-")) {
        const text = line.replace(/^[\s*-]+/, "").trim();
        return (
          <View key={index} style={styles.listItemRow}>
            <Text style={styles.listBullet}>•</Text>
            <Text style={styles.listItemText}>{parseBoldText(text)}</Text>
          </View>
        );
      }

      // 3. Identify header / big text
      if (line.trim().startsWith("###")) {
        const text = line.replace("###", "").trim();
        return (
          <Text key={index} style={styles.headerText3}>
            {parseBoldText(text)}
          </Text>
        );
      }
      if (line.trim().startsWith("##")) {
        const text = line.replace("##", "").trim();
        return (
          <Text key={index} style={styles.headerText2}>
            {parseBoldText(text)}
          </Text>
        );
      }

      // 4. Default Paragraph
      return (
        <Text key={index} style={styles.paragraphText}>
          {parseBoldText(line)}
        </Text>
      );
    });
  };

  // Helper to split text by ** to apply bold styles
  const parseBoldText = (text) => {
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, index) => {
      // Even indexes are normal text, odd indexes are bold text
      if (index % 2 === 1) {
        return (
          <Text key={index} style={styles.boldText}>
            {part}
          </Text>
        );
      }
      return part;
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      {/* Header */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={[COLORS.gradientStart, COLORS.gradientEnd]}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={styles.assistantAvatar}>
                <Ionicons name="sparkles" size={18} color={COLORS.white} />
              </View>
              <View>
                <Text style={styles.headerTitle}>Expensu AI Assistant</Text>
                <Text style={styles.headerSubtitle}>Personal Financial Companion</Text>
              </View>
            </View>

            {messages.length > 1 && (
              <TouchableOpacity
                onPress={clearChat}
                style={styles.clearButton}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={20} color={COLORS.white} />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </View>

      {/* Messages area */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.chatScroll}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          loading && (
            <Animated.View entering={FadeInUp} style={styles.typingIndicatorContainer}>
              <View style={styles.aiAvatarSmall}>
                <Ionicons name="sparkles" size={12} color={COLORS.white} />
              </View>
              <View style={styles.typingBubble}>
                <ActivityIndicator size="small" color={COLORS.primary} style={{ marginRight: 6 }} />
                <Text style={styles.typingText}>Expensu AI is thinking...</Text>
              </View>
            </Animated.View>
          )
        }
        renderItem={({ item }) => {
          const isUser = item.role === "user";
          return (
            <Animated.View
              entering={isUser ? SlideInRight : FadeInUp}
              layout={Layout.springify()}
              style={[
                styles.messageContainer,
                isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
              ]}
            >
              {!isUser && (
                <View style={styles.aiAvatarSmall}>
                  <Ionicons name="sparkles" size={12} color={COLORS.white} />
                </View>
              )}
              <View
                style={[
                  styles.messageBubble,
                  isUser ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                {isUser ? (
                  <Text style={styles.userText}>{item.content}</Text>
                ) : (
                  <View style={styles.aiTextContainer}>
                    {renderFormattedContent(item.content)}
                  </View>
                )}
              </View>
            </Animated.View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="sparkles" size={44} color={COLORS.primary} />
            <Text style={styles.emptyTitle}>Ask Expensu AI Anything!</Text>
          </View>
        }
      />

      {/* Suggestions Tray (Only shown when there are no active messages beyond the welcome note) */}
      {messages.length === 1 && !loading && (
        <Animated.View entering={FadeInDown.delay(200)} style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>💡 Quick Suggestions:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsScroll}
          >
            {SUGGESTIONS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.suggestionPill}
                onPress={() => handleSuggestionPress(item.prompt)}
                activeOpacity={0.8}
              >
                <Text style={styles.suggestionText}>{item.text}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {/* Input container */}
      <View style={styles.inputWrapper}>
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Ask AI (e.g. 'Who owes me money?')..."
            placeholderTextColor={COLORS.gray}
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            multiline
            maxHeight={100}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !message.trim() && styles.sendButtonDisabled,
            ]}
            onPress={() => handleSend()}
            disabled={!message.trim() || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <LinearGradient
                colors={
                  message.trim()
                    ? [COLORS.gradientStart, COLORS.gradientEnd]
                    : ["#E5E7EB", "#E5E7EB"]
                }
                style={styles.sendGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="send" size={16} color={COLORS.white} />
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  headerContainer: {
    ...SHADOWS.soft,
  },
  headerGradient: {
    paddingTop: Platform.OS === "ios" ? 54 : 36,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  assistantAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "800",
  },
  headerSubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 1,
  },
  clearButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  chatScroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  messageContainer: {
    flexDirection: "row",
    marginVertical: 6,
    maxWidth: "85%",
    alignItems: "flex-end",
  },
  userMessageContainer: {
    alignSelf: "flex-end",
  },
  assistantMessageContainer: {
    alignSelf: "flex-start",
  },
  aiAvatarSmall: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
    marginBottom: 2,
  },
  messageBubble: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...SHADOWS.soft,
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  userText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "550",
    lineHeight: 20,
  },
  aiTextContainer: {
    gap: 6,
  },
  paragraphText: {
    color: COLORS.dark,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "400",
  },
  boldText: {
    fontWeight: "bold",
    color: COLORS.dark,
  },
  quoteBlock: {
    backgroundColor: "#F3F4F6",
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginVertical: 4,
  },
  quoteText: {
    color: "#4B5563",
    fontSize: 13,
    fontStyle: "italic",
    lineHeight: 18,
  },
  listItemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    paddingLeft: 6,
    marginVertical: 2,
  },
  listBullet: {
    fontSize: 14,
    color: COLORS.primary,
    lineHeight: 21,
  },
  listItemText: {
    flex: 1,
    color: COLORS.dark,
    fontSize: 14,
    lineHeight: 21,
  },
  headerText2: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.dark,
    marginTop: 8,
    marginBottom: 4,
  },
  headerText3: {
    fontSize: 15,
    fontWeight: "750",
    color: COLORS.dark,
    marginTop: 6,
    marginBottom: 2,
  },
  typingIndicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginVertical: 6,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    ...SHADOWS.soft,
  },
  typingText: {
    fontSize: 13,
    color: COLORS.gray,
    fontWeight: "600",
  },
  suggestionsContainer: {
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: "#ECECEC",
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.gray,
    paddingHorizontal: 16,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  suggestionsScroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  suggestionPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.dark,
  },
  inputWrapper: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 32 : 12,
    borderTopWidth: 1,
    borderTopColor: "#ECECEC",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    color: COLORS.dark,
    fontSize: 14,
    paddingVertical: 4,
    marginRight: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  sendButtonDisabled: {
    backgroundColor: "#E5E7EB",
  },
  sendGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.gray,
    marginTop: 12,
  },
});
