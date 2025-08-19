import { Pressable, StyleSheet, Text, View } from "react-native";
import { font, mScale } from "../theme/scale";
import { colors, radii, space, touch } from "../theme/tokens";

type ChoiceButtonProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
};

export default function ChoiceButton({
  label,
  selected,
  onPress,
  disabled,
  fullWidth,
  size = "md",
}: ChoiceButtonProps) {
  const s = sizes[size];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      style={[
        styles.base,
        {
          paddingVertical: mScale(s.pv),
          paddingHorizontal: mScale(s.ph),
          borderRadius: radii.md,
          minHeight: touch.min,
          minWidth: mScale(88),
          opacity: disabled ? 0.5 : 1,
          borderWidth: 1.5,
          borderColor: selected ? colors.brand : colors.border,
          backgroundColor: selected ? colors.brand : colors.white,
          alignSelf: fullWidth ? "stretch" : "flex-start",
        },
      ]}
    >
      <View style={{ alignItems: "center" }}>
        <Text
          style={{
            color: selected ? colors.white : colors.ink,
            fontWeight: "700",
            fontSize: font(s.fs),
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const sizes = {
  sm: { pv: 8, ph: 12, fs: 14 },
  md: { pv: 12, ph: 16, fs: 16 },
  lg: { pv: 14, ph: 20, fs: 18 },
} as const;

const styles = StyleSheet.create({
  base: {
    marginRight: space.sm,
  },
});
