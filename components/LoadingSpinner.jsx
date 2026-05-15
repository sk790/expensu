import React, { useEffect } from "react";
import { View, Text, StyleSheet, Image, Dimensions, StatusBar } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
  withDelay,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../utils/constants";

const { width } = Dimensions.get("window");

export default function LoadingSpinner({ message = "Loading..." }) {
  const logoScale = useSharedValue(1);
  const ringRotate = useSharedValue(0);
  const opacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    // Pulse logo
    logoScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 800, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
        withTiming(1, { duration: 800, easing: Easing.bezier(0.4, 0, 0.2, 1) })
      ),
      -1,
      true
    );

    // Rotate ring
    ringRotate.value = withRepeat(
      withTiming(360, { duration: 1500, easing: Easing.linear }),
      -1
    );

    // Fade in
    opacity.value = withTiming(1, { duration: 600 });
    textOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ringRotate.value}deg` }],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [
      { translateY: interpolate(textOpacity.value, [0, 1], [10, 0]) },
    ],
  }));

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={["#F4F5FA", "#FFFFFF"]}
        style={StyleSheet.absoluteFill}
      />
      
      <Animated.View style={[styles.container, containerStyle]}>
        {/* Animated outer ring */}
        <View style={styles.ringContainer}>
          <Animated.View style={[styles.ring, ringStyle]}>
            <LinearGradient
              colors={[COLORS.primary, "transparent"]}
              style={styles.ringGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </Animated.View>
        </View>

        {/* Logo */}
        <View style={styles.logoWrapper}>
          <Animated.View style={[styles.logoContainer, logoStyle]}>
            <Image
              source={require("../assets/images/icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        {/* Text */}
        <Animated.View style={[styles.textWrapper, textStyle]}>
          <Text style={styles.loadingText}>{message}</Text>
          <View style={styles.dotsRow}>
            {[0, 1, 2].map((i) => (
              <Dot key={i} delay={i * 200} />
            ))}
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

function Dot({ delay }) {
  const dotScale = useSharedValue(0.5);
  const dotOpacity = useSharedValue(0.3);

  useEffect(() => {
    dotScale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0.5, { duration: 500 })
        ),
        -1,
        true
      )
    );
    dotOpacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0.3, { duration: 500 })
        ),
        -1,
        true
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
    opacity: dotOpacity.value,
  }));

  return <Animated.View style={[styles.dot, style]} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  ringContainer: {
    width: 140,
    height: 140,
    justifyContent: "center",
    alignItems: "center",
  },
  ring: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  ringGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.6,
  },
  logoWrapper: {
    position: "absolute",
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: "#FFF",
    borderRadius: 25,
    padding: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  textWrapper: {
    marginTop: 40,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.dark,
    letterSpacing: 0.5,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
});