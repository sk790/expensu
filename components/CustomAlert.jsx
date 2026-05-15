import React, { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../utils/constants";

const { width } = Dimensions.get("window");

const ALERT_TYPES = {
  success: {
    icon: "checkmark-circle",
    color: "#22C55E",
    bg: "#F0FDF4",
    border: "#86EFAC",
  },
  error: {
    icon: "close-circle",
    color: "#EF4444",
    bg: "#FEF2F2",
    border: "#FCA5A5",
  },
  warning: {
    icon: "warning",
    color: "#F59E0B",
    bg: "#FFFBEB",
    border: "#FCD34D",
  },
  info: {
    icon: "information-circle",
    color: "#3B82F6",
    bg: "#EFF6FF",
    border: "#93C5FD",
  },
  confirm: {
    icon: "help-circle",
    color: COLORS.primary,
    bg: "#F0FDF4",
    border: "#86EFAC",
  },
};

export default function CustomAlert({
  visible,
  type = "info",
  title,
  message,
  buttons = [],
  onDismiss,
}) {
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const iconBounce = useRef(new Animated.Value(0)).current;

  const config = ALERT_TYPES[type] || ALERT_TYPES.info;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          damping: 14,
          stiffness: 220,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        Animated.sequence([
          Animated.timing(iconBounce, { toValue: -6, duration: 120, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
          Animated.spring(iconBounce, { toValue: 0, damping: 8, stiffness: 300, useNativeDriver: true }),
        ]).start();
      });
    } else {
      scaleAnim.setValue(0.7);
      opacityAnim.setValue(0);
      iconBounce.setValue(0);
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0.85, duration: 150, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => onDismiss?.());
  };

  const defaultButtons = buttons.length > 0 ? buttons : [{ text: "OK", onPress: handleDismiss }];

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleDismiss} statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={handleDismiss} />
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
          {/* Icon */}
          <Animated.View
            style={[styles.iconWrapper, { backgroundColor: config.bg, borderColor: config.border }, { transform: [{ translateY: iconBounce }] }]}
          >
            <Ionicons name={config.icon} size={40} color={config.color} />
          </Animated.View>

          {/* Content */}
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          {/* Buttons */}
          <View style={[styles.buttonRow, defaultButtons.length === 1 && styles.singleButton]}>
            {defaultButtons.map((btn, i) => {
              const isDanger = btn.style === "destructive";
              const isCancel = btn.style === "cancel";
              const isPrimary = !isDanger && !isCancel;
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.btn,
                    defaultButtons.length === 1 && styles.btnFull,
                    isPrimary && { backgroundColor: config.color },
                    isDanger && styles.btnDanger,
                    isCancel && styles.btnCancel,
                  ]}
                  onPress={() => {
                    handleDismiss();
                    setTimeout(() => btn.onPress?.(), 150);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.btnText, (isPrimary || isDanger) && styles.btnTextLight, isCancel && styles.btnTextCancel]}>
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 28,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 10,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A1A2E",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  singleButton: {
    justifyContent: "center",
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnFull: {
    flex: 1,
  },
  btnDanger: {
    backgroundColor: "#EF4444",
  },
  btnCancel: {
    backgroundColor: "#F3F4F6",
  },
  btnText: {
    fontSize: 16,
    fontWeight: "700",
  },
  btnTextLight: {
    color: "#FFFFFF",
  },
  btnTextCancel: {
    color: "#6B7280",
  },
});
