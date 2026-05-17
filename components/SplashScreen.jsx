import React, { useEffect } from "react";
import { View, Text, StyleSheet, Dimensions, StatusBar } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  withDelay,
  runOnJS,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop, Circle, G } from "react-native-svg";

const { width, height } = Dimensions.get("window");

export default function SplashScreen({ loading, onFinish }) {
  const progress = useSharedValue(0);
  const screenOpacity = useSharedValue(1);
  const logoScale = useSharedValue(0.3);
  const logoOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(30);
  const contentOpacity = useSharedValue(0);
  const spinnerRotation = useSharedValue(0);

  // Vertical voice visualizer bars animation
  const bar1Scale = useSharedValue(1);
  const bar2Scale = useSharedValue(1);
  const bar3Scale = useSharedValue(1);
  const bar4Scale = useSharedValue(1);
  const bar5Scale = useSharedValue(1);

  useEffect(() => {
    // 1. Initial Intro Animations
    logoScale.value = withTiming(1, {
      duration: 1000,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });
    logoOpacity.value = withTiming(1, { duration: 800 });

    contentTranslateY.value = withDelay(
      300,
      withTiming(0, {
        duration: 800,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      })
    );
    contentOpacity.value = withDelay(300, withTiming(1, { duration: 800 }));

    // 2. Loop Spinner infinitely
    spinnerRotation.value = withRepeat(
      withTiming(360, { duration: 1200, easing: Easing.linear }),
      -1,
      false
    );

    // 3. Voice visualizer gentle bouncing animations
    const animateBar = (scale, delay) => {
      scale.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1.8, { duration: 500, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.7, { duration: 500, easing: Easing.inOut(Easing.ease) }),
            withTiming(1.0, { duration: 400, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          false
        )
      );
    };

    animateBar(bar1Scale, 0);
    animateBar(bar2Scale, 150);
    animateBar(bar3Scale, 300);
    animateBar(bar4Scale, 450);
    animateBar(bar5Scale, 600);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle Progress Bar & Screen Fade Out
  useEffect(() => {
    if (loading) {
      // If we are actively loading data, fill the progress bar to 90% and wait
      progress.value = withTiming(0.9, {
        duration: 2500,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    } else {
      // Once loading is complete, quickly fill to 100% and then fade out the splash screen
      const currentVal = progress.value;
      const duration = currentVal < 0.9 ? 1500 : 500; // Minimum viewing time if quickly loaded

      progress.value = withTiming(
        1.0,
        {
          duration: duration,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        },
        (finished) => {
          if (finished) {
            // Fade out splash screen
            screenOpacity.value = withTiming(
              0,
              { duration: 400, easing: Easing.ease },
              (fadeOutFinished) => {
                if (fadeOutFinished && onFinish) {
                  runOnJS(onFinish)();
                }
              }
            );
          }
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Animated styles
  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: contentTranslateY.value }],
    opacity: contentOpacity.value,
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinnerRotation.value}deg` }],
  }));

  // Helper animated styles for voice bars
  const b1Style = useAnimatedStyle(() => ({ transform: [{ scaleY: bar1Scale.value }] }));
  const b2Style = useAnimatedStyle(() => ({ transform: [{ scaleY: bar2Scale.value }] }));
  const b3Style = useAnimatedStyle(() => ({ transform: [{ scaleY: bar3Scale.value }] }));
  const b4Style = useAnimatedStyle(() => ({ transform: [{ scaleY: bar4Scale.value }] }));
  const b5Style = useAnimatedStyle(() => ({ transform: [{ scaleY: bar5Scale.value }] }));

  return (
    <Animated.View style={[styles.root, screenStyle]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Background Gradient matching the design (soft mint/turquoise to light purple/lavender) */}
      <LinearGradient
        colors={["#C5F9EB", "#D0FFF0", "#EAE2FC", "#E5DDFC"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Top Faded "SPLITMATE" Watermark Text */}
      <View style={styles.topWatermarkContainer}>
        <Text style={styles.topWatermarkText}>SPLITMATE</Text>
      </View>

      <View style={styles.centerContainer}>
        {/* Swirl Logo Container */}
        <Animated.View style={[styles.logoContainer, logoStyle]}>
          <Svg width={180} height={180} viewBox="0 0 200 200">
            <Defs>
              {/* Swirl Blades Gradients */}
              <SvgLinearGradient id="bladeGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#4DE0C2" />
                <Stop offset="100%" stopColor="#25B4AE" />
              </SvgLinearGradient>
              
              <SvgLinearGradient id="bladeGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#75BEFD" />
                <Stop offset="100%" stopColor="#968CFF" />
              </SvgLinearGradient>
              
              <SvgLinearGradient id="bladeGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#A288FF" />
                <Stop offset="100%" stopColor="#E2A6FF" />
              </SvgLinearGradient>

              <SvgLinearGradient id="bladeGrad4" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#3FBEBA" />
                <Stop offset="100%" stopColor="#1B8797" />
              </SvgLinearGradient>
            </Defs>

            {/* Rotationally Symmetric Swirl Blades */}
            {/* Top-Left / Mint Blade */}
            <G transform="rotate(0, 100, 100)">
              <Path
                d="M 100 25 C 135 25, 162 48, 172 80 C 153 74, 134 78, 120 92 C 124 74, 115 60, 96 60 C 91 60, 86 62, 82 65 C 86 46, 92 34, 100 25 Z"
                fill="url(#bladeGrad1)"
              />
            </G>

            {/* Top-Right / Blue-Lavender Blade */}
            <G transform="rotate(90, 100, 100)">
              <Path
                d="M 100 25 C 135 25, 162 48, 172 80 C 153 74, 134 78, 120 92 C 124 74, 115 60, 96 60 C 91 60, 86 62, 82 65 C 86 46, 92 34, 100 25 Z"
                fill="url(#bladeGrad2)"
              />
            </G>

            {/* Bottom-Right / Purple-Pink Blade */}
            <G transform="rotate(180, 100, 100)">
              <Path
                d="M 100 25 C 135 25, 162 48, 172 80 C 153 74, 134 78, 120 92 C 124 74, 115 60, 96 60 C 91 60, 86 62, 82 65 C 86 46, 92 34, 100 25 Z"
                fill="url(#bladeGrad3)"
              />
            </G>

            {/* Bottom-Left / Teal Blade (with curved motion arrow) */}
            <G transform="rotate(270, 100, 100)">
              <Path
                d="M 100 25 C 135 25, 162 48, 172 80 C 153 74, 134 78, 120 92 C 124 74, 115 60, 96 60 C 91 60, 86 62, 82 65 C 86 46, 92 34, 100 25 Z"
                fill="url(#bladeGrad4)"
              />
              
              {/* Sleek dark arrow showing circular split/flow motion in the inner swirl ring */}
              <Path
                d="M 100 95 C 108 95, 115 90, 119 82 L 126 89 L 122 72 L 105 77 L 112 84 C 109 88, 105 91, 100 91 C 95 91, 90 88, 87 84 L 81 89 C 85 93, 92 95, 100 95 Z"
                fill="#165B67"
                opacity={0.8}
              />
            </G>
          </Svg>
        </Animated.View>

        {/* Text and Tagline */}
        <Animated.View style={[styles.textContainer, contentStyle]}>
          <View style={styles.brandNameContainer}>
            <Text style={styles.brandSplit}>SPLIT</Text>
            <Text style={styles.brandMate}>MATE</Text>
          </View>
          <Text style={styles.tagline}>Easy. Fair. Shared.</Text>
        </Animated.View>
      </View>

      {/* Bottom Footer Controls (Visualizer, Progress, and Spinner) */}
      <View style={styles.bottomContainer}>
        {/* Voice Visualizer Indicator */}
        <View style={styles.visualizerContainer}>
          <Animated.View style={[styles.vBar, styles.vBar1, b1Style]} />
          <Animated.View style={[styles.vBar, styles.vBar2, b2Style]} />
          <Animated.View style={[styles.vBar, styles.vBar3, b3Style]} />
          <Animated.View style={[styles.vBar, styles.vBar4, b4Style]} />
          <Animated.View style={[styles.vBar, styles.vBar5, b5Style]} />
        </View>

        {/* Linear Progress Bar */}
        <View style={styles.progressTrack}>
          <Animated.View style={[StyleSheet.absoluteFill, progressStyle]}>
            <LinearGradient
              colors={["#4CE0C2", "#75BEFD", "#968CFF"]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>
        </View>

        {/* Loading Spinner & Label */}
        <View style={styles.loadingRow}>
          <Text style={styles.loadingText}>Loading...</Text>
          <Animated.View style={[styles.spinnerWrapper, spinnerStyle]}>
            <Svg width={18} height={18} viewBox="0 0 24 24">
              <Circle cx="12" cy="3" r="2.2" fill="#7D8C9E" opacity="1.0" />
              <Circle cx="18.36" cy="5.64" r="2.2" fill="#7D8C9E" opacity="0.85" />
              <Circle cx="21" cy="12" r="2.2" fill="#7D8C9E" opacity="0.7" />
              <Circle cx="18.36" cy="18.36" r="2.2" fill="#7D8C9E" opacity="0.55" />
              <Circle cx="12" cy="21" r="2.2" fill="#7D8C9E" opacity="0.4" />
              <Circle cx="5.64" cy="18.36" r="2.2" fill="#7D8C9E" opacity="0.25" />
              <Circle cx="3" cy="12" r="2.2" fill="#7D8C9E" opacity="0.15" />
              <Circle cx="5.64" cy="5.64" r="2.2" fill="#7D8C9E" opacity="0.1" />
            </Svg>
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#C5F9EB",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: height * 0.08,
  },
  topWatermarkContainer: {
    position: "absolute",
    top: height * 0.07,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  topWatermarkText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#6F8E8A",
    opacity: 0.18,
    letterSpacing: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: height * 0.05,
  },
  logoContainer: {
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#25B4AE",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },
  textContainer: {
    marginTop: 24,
    alignItems: "center",
  },
  brandNameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandSplit: {
    fontSize: 34,
    fontWeight: "900",
    color: "#0F2837",
    letterSpacing: 0.5,
  },
  brandMate: {
    fontSize: 34,
    fontWeight: "400",
    color: "#0F2837",
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 16,
    fontWeight: "500",
    color: "#5C6E80",
    marginTop: 8,
    letterSpacing: 0.3,
  },
  bottomContainer: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: width * 0.15,
    gap: 20,
    marginBottom: height * 0.02,
  },
  visualizerContainer: {
    flexDirection: "row",
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  vBar: {
    width: 6,
    borderRadius: 3,
  },
  vBar1: {
    height: 12,
    backgroundColor: "#4DE0C2",
  },
  vBar2: {
    height: 24,
    backgroundColor: "#63CDFA",
  },
  vBar3: {
    height: 34,
    backgroundColor: "#898AFF",
  },
  vBar4: {
    height: 24,
    backgroundColor: "#A79DFF",
  },
  vBar5: {
    height: 12,
    backgroundColor: "#C5B2FC",
  },
  progressTrack: {
    width: "100%",
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.45)",
    borderRadius: 3,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#5C6E80",
    letterSpacing: 0.5,
  },
  spinnerWrapper: {
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
});
