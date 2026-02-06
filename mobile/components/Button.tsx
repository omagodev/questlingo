import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { COLORS, FONTS } from "../theme";

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: "primary" | "secondary" | "accent" | "danger";
  fullWidth?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = "primary",
  fullWidth = false,
  disabled = false,
  style,
}) => {
  const buttonStyles = [
    styles.base,
    styles[variant],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    variant === "secondary" ? styles.textSecondary : styles.textLight,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled}
    >
      <Text style={textStyles}>{children}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderBottomWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  fullWidth: {
    width: "100%",
  },
  primary: {
    backgroundColor: COLORS.primary,
    borderBottomColor: "#2b52a1", // Darker blue
  },
  secondary: {
    backgroundColor: COLORS.card,
    borderBottomColor: "#000000",
  },
  accent: {
    backgroundColor: COLORS.accent,
    borderBottomColor: "#6e45bc",
  },
  danger: {
    backgroundColor: COLORS.danger,
    borderBottomColor: "#a12d41",
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  textLight: {
    color: COLORS.dark,
  },
  textSecondary: {
    color: COLORS.text,
  },
});

export default Button;
