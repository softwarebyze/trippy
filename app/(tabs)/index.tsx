import React, { useRef } from "react";
import {
  Dimensions,
  StyleSheet,
  View,
  PanResponder,
  GestureResponderEvent,
} from "react-native";
import {
  useSharedValue,
  useDerivedValue,
  runOnJS,
  withRepeat,
  withTiming,
  useAnimatedReaction,
} from "react-native-reanimated";
import {
  Canvas,
  Circle,
  Group,
  LinearGradient,
  Paint,
  BlurMask,
  vec,
} from "@shopify/react-native-skia";

const { width, height } = Dimensions.get("window");

// Trippy color palette
const palette = [
  "#ff00cc",
  "#00ffcc",
  "#fffb00",
  "#ff0066",
  "#00ff99",
  "#3333ff",
  "#ff8800",
  "#00aaff",
];

// Particle system
function createParticle(x: number, y: number, color: string) {
  return {
    pos: { x, y },
    vel: { x: (Math.random() - 0.5) * 6, y: (Math.random() - 0.5) * 6 },
    radius: 32 + Math.random() * 32,
    color,
    life: 1,
    decay: 0.012 + Math.random() * 0.01,
  };
}

export default function TrippySkia() {
  // Use a shared value for the particle array
  const particles = useSharedValue<any[]>([]);
  // Use a shared value for the gradient index
  const gradientIdx = useSharedValue(0);

  // Animate gradient
  React.useEffect(() => {
    gradientIdx.value = withRepeat(
      withTiming(palette.length, { duration: 32000 }),
      -1,
      false
    );
  }, []);

  // Animate particles with Reanimated
  useAnimatedReaction(
    () => particles.value,
    (current, prev) => {
      // This runs on the UI thread
      if (!current) return;
      const next = current
        .map((p) => {
          // Swirl effect
          const angle =
            Math.atan2(p.pos.y - height / 2, p.pos.x - width / 2) + 0.08;
          const speed = 1.2;
          p.vel.x += Math.cos(angle) * 0.2;
          p.vel.y += Math.sin(angle) * 0.2;
          p.pos.x += p.vel.x * speed;
          p.pos.y += p.vel.y * speed;
          p.radius *= 0.98;
          p.life -= p.decay;
          return p;
        })
        .filter((p) => p.life > 0.05 && p.radius > 2);
      particles.value = next;
    },
    []
  );

  // Touch handler
  const handleTouch = (evt: GestureResponderEvent) => {
    const { locationX: x, locationY: y } = evt.nativeEvent;
    runOnJS(() => {
      particles.value = [
        ...particles.value,
        ...Array.from({ length: 10 }, () =>
          createParticle(
            x + (Math.random() - 0.5) * 20,
            y + (Math.random() - 0.5) * 20,
            palette[Math.floor(Math.random() * palette.length)]
          )
        ),
      ];
    })();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: handleTouch,
      onPanResponderMove: handleTouch,
    })
  ).current;

  // Derived gradient colors
  const gradA = useDerivedValue(() => {
    const idx = Math.floor(gradientIdx.value) % palette.length;
    return palette[idx];
  }, [gradientIdx]);
  const gradB = useDerivedValue(() => {
    const idx = (Math.floor(gradientIdx.value) + 1) % palette.length;
    return palette[idx];
  }, [gradientIdx]);

  // Derived particles for rendering
  const renderParticles = useDerivedValue(() => {
    return particles.value.map((p, i) => (
      <Group key={i}>
        <Circle
          cx={p.pos.x}
          cy={p.pos.y}
          r={p.radius}
          color={p.color}
          opacity={p.life * 0.7}
        >
          <BlurMask blur={32} style="solid" />
        </Circle>
      </Group>
    ));
  }, [particles]);

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Canvas style={{ width, height }}>
        <Paint>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(width, height)}
            colors={[gradA.value, gradB.value]}
          />
        </Paint>
        {renderParticles.value}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
});
