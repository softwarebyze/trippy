import React, { useRef } from "react";
import { Dimensions, StyleSheet, View, PanResponder } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";
import { Gyroscope } from "expo-sensors";
import Svg, { G, Path, Defs, RadialGradient, Stop } from "react-native-svg";

const { width, height } = Dimensions.get("window");

// Animated background color values
const colors = [
  "#ff00cc",
  "#3333ff",
  "#00ffcc",
  "#fffb00",
  "#ff0066",
  "#00ff99",
];

function Kaleidoscope({
  progress,
}: {
  progress: Animated.SharedValue<number>;
}) {
  // Animated rotation and morph
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${progress.value * 2 * Math.PI}rad` },
        { scale: 1.2 + 0.2 * Math.sin(progress.value * Math.PI * 2) },
      ],
      opacity: 0.7,
    };
  });

  // SVG kaleidoscope pattern
  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, animatedStyle]}
      pointerEvents="none"
    >
      <Svg width={width} height={height}>
        <Defs>
          <RadialGradient id="grad" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#fff" stopOpacity="0.2" />
            <Stop offset="100%" stopColor="#000" stopOpacity="0.1" />
          </RadialGradient>
        </Defs>
        <G>
          {[...Array(8)].map((_, i) => (
            <Path
              key={i}
              d={`M${width / 2},${height / 2} L${
                width / 2 + Math.cos((i * Math.PI) / 4) * width
              } ${height / 2 + Math.sin((i * Math.PI) / 4) * height} Q${
                width / 2 + Math.cos(((i + 0.5) * Math.PI) / 4) * (width / 2)
              } ${
                height / 2 + Math.sin(((i + 0.5) * Math.PI) / 4) * (height / 2)
              } ${width / 2},${height / 2}`}
              fill={`url(#grad)`}
              stroke={`hsl(${i * 45 + progress.value * 360}, 100%, 60%)`}
              strokeWidth={
                8 + 8 * Math.abs(Math.sin(progress.value * Math.PI * 2 + i))
              }
              opacity={
                0.5 + 0.5 * Math.abs(Math.cos(progress.value * Math.PI * 2 + i))
              }
            />
          ))}
        </G>
      </Svg>
    </Animated.View>
  );
}

export default function TrippyScreen() {
  // For swirling background
  const progress = useSharedValue(0);
  React.useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 8000 }), -1, true);
  }, []);

  // For touch ripples
  const rippleX = useSharedValue(width / 2);
  const rippleY = useSharedValue(height / 2);
  const rippleScale = useSharedValue(0);

  // For device motion
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  React.useEffect(() => {
    const sub = Gyroscope.addListener(({ x, y }) => {
      tiltX.value = x;
      tiltY.value = y;
    });
    Gyroscope.setUpdateInterval(16);
    return () => sub.remove();
  }, []);

  // PanResponder for touch
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        rippleX.value = locationX;
        rippleY.value = locationY;
        rippleScale.value = 0;
        rippleScale.value = withTiming(1, { duration: 1200 });
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        rippleX.value = locationX;
        rippleY.value = locationY;
      },
      onPanResponderRelease: () => {
        rippleScale.value = withTiming(0, { duration: 800 });
      },
    })
  ).current;

  // Animated background style
  const bgStyle = useAnimatedStyle(() => {
    // Animate between colors
    const colorIdx = Math.floor(progress.value * (colors.length - 1));
    const nextIdx = (colorIdx + 1) % colors.length;
    const color = interpolateColor(
      progress.value * (colors.length - 1) - colorIdx,
      [0, 1],
      [colors[colorIdx], colors[nextIdx]]
    );
    // Slight tilt based on device
    const translateX = tiltY.value * 40;
    const translateY = tiltX.value * 40;
    return {
      backgroundColor: color,
      transform: [{ scale: 1.1 }, { translateX }, { translateY }],
    };
  });

  // Animated ripple style
  const rippleStyle = useAnimatedStyle(() => {
    return {
      position: "absolute",
      left: rippleX.value - 100,
      top: rippleY.value - 100,
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: "rgba(255,255,255,0.15)",
      opacity: 1 - rippleScale.value,
      transform: [{ scale: 0.5 + rippleScale.value * 2.5 }],
    };
  });

  // Animated morphing shape
  const shapeStyle = useAnimatedStyle(() => {
    const borderRadius =
      60 + Math.abs(Math.sin(progress.value * Math.PI * 2)) * 80;
    return {
      position: "absolute",
      left: width / 2 - 80,
      top: height / 2 - 80,
      width: 160,
      height: 160,
      backgroundColor: "rgba(0,0,0,0.12)",
      borderRadius,
      borderWidth: 4,
      borderColor: "rgba(255,255,255,0.3)",
      shadowColor: "#fff",
      shadowOpacity: 0.7,
      shadowRadius: 30,
      shadowOffset: { width: 0, height: 0 },
    };
  });

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Animated.View style={[StyleSheet.absoluteFill, bgStyle]} />
      <Kaleidoscope progress={progress} />
      <Animated.View style={rippleStyle} pointerEvents="none" />
      <Animated.View style={shapeStyle} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
});
