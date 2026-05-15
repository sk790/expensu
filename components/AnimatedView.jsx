/**
 * AnimatedView — drop-in replacement for Animated.View with entering/exiting.
 *
 * Fixes the Android "shadow renders before opacity=0" bug by setting
 * renderToHardwareTextureAndroid={true}, which composites the entire
 * subtree (including elevation shadow) into a GPU texture FIRST,
 * then animates that texture — so the shadow never appears before the element.
 *
 * Usage: replace <Animated.View entering={...}> with <AnimatedView entering={...}>
 */
import React from "react";
import { Platform } from "react-native";
import Animated from "react-native-reanimated";

const AnimatedView = React.forwardRef(({ children, style, ...props }, ref) => {
  return (
    <Animated.View
      ref={ref}
      style={style}
      // Fix for Android: render to GPU texture before animating, 
      // preventing shadow/elevation flash during entrance animations
      renderToHardwareTextureAndroid={Platform.OS === "android"}
      {...props}
    >
      {children}
    </Animated.View>
  );
});

AnimatedView.displayName = "AnimatedView";

export default AnimatedView;
