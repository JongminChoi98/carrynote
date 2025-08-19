import { ScrollView, Text, useWindowDimensions, View } from "react-native";
import { space } from "../theme/tokens";
import ChoiceButton from "./ChoiceButton";

export type ChoiceOption<T extends string> = {
  label: string;
  value: T;
  disabled?: boolean;
};

type ChoiceGroupProps<T extends string> = {
  title?: string;
  options: ChoiceOption<T>[];
  value: T;
  onChange: (v: T) => void;
  horizontal?: boolean;
  wrapOnSmall?: boolean;
  gap?: number;
  size?: "sm" | "md" | "lg";
};

export default function ChoiceGroup<T extends string>({
  title,
  options,
  value,
  onChange,
  horizontal = true,
  wrapOnSmall = true,
  gap = space.sm,
  size = "md",
}: ChoiceGroupProps<T>) {
  const { width } = useWindowDimensions();
  const isSmall = width < 360;
  const useWrap = !horizontal || (wrapOnSmall && isSmall);

  const Container: any = horizontal && !useWrap ? ScrollView : View;
  const containerProps =
    horizontal && !useWrap
      ? {
          horizontal: true,
          showsHorizontalScrollIndicator: false,
          contentContainerStyle: { paddingRight: 4, alignItems: "center" },
          style: { marginBottom: space.md },
        }
      : { style: { marginBottom: space.md } };

  return (
    <View style={{ marginBottom: space.lg }}>
      {title ? (
        <Text
          style={{ fontSize: 16, fontWeight: "700", marginBottom: space.sm }}
        >
          {title}
        </Text>
      ) : null}

      <Container {...containerProps} accessibilityRole="radiogroup">
        <View
          style={{
            flexDirection: "row",
            flexWrap: useWrap ? "wrap" : "nowrap",
          }}
        >
          {options.map((opt, idx) => (
            <View
              key={opt.value}
              style={{
                marginRight: idx === options.length - 1 && !useWrap ? 0 : gap,
                marginBottom: useWrap ? gap : 0,
              }}
            >
              <ChoiceButton
                label={opt.label}
                selected={value === opt.value}
                onPress={() => !opt.disabled && onChange(opt.value)}
                disabled={opt.disabled}
                size={size}
              />
            </View>
          ))}
        </View>
      </Container>
    </View>
  );
}
