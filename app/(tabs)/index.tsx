import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Dimensions,
  StyleSheet,
  View,
  PanResponder,
  GestureResponderEvent,
} from "react-native";
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
  const [particles, setParticles] = useState<any[]>([]);
  const [gradientIdx, setGradientIdx] = useState(0);
  const animationRef = useRef<number>();

  // Animation loop
  const animate = useCallback(() => {
    setParticles((prev) =>
      prev
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
        .filter((p) => p.life > 0.05 && p.radius > 2)
    );
    animationRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [animate]);

  // Animate gradient
  useEffect(() => {
    const interval = setInterval(() => {
      setGradientIdx((idx) => (idx + 1) % palette.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Touch handler
  const handleTouch = (evt: GestureResponderEvent) => {
    const { locationX: x, locationY: y } = evt.nativeEvent;
    setParticles((prev) => [
      ...prev,
      ...Array.from({ length: 10 }, () =>
        createParticle(
          x + (Math.random() - 0.5) * 20,
          y + (Math.random() - 0.5) * 20,
          palette[Math.floor(Math.random() * palette.length)]
        )
      ),
    ]);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: handleTouch,
      onPanResponderMove: handleTouch,
    })
  ).current;

  // Gradient colors
  const gradA = palette[gradientIdx];
  const gradB = palette[(gradientIdx + 1) % palette.length];

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Canvas style={{ width, height }}>
        <Paint>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(width, height)}
            colors={[gradA, gradB]}
          />
        </Paint>
        {particles.map((p, i) => (
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
        ))}
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
