import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  ActivityIndicator,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, FontSizes, Radius } from '../../constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'gold' | 'green' | 'danger' | 'outline';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export default function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  style,
  textStyle,
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
}: ButtonProps) {
  const sizeStyles = {
    sm: { paddingVertical: 7, paddingHorizontal: 13, borderRadius: Radius.md },
    md: { paddingVertical: 11, paddingHorizontal: 18, borderRadius: Radius.lg },
    lg: { paddingVertical: 15, paddingHorizontal: 24, borderRadius: Radius.xl },
  };

  const textSizes = {
    sm: FontSizes.xs,
    md: FontSizes.sm,
    lg: FontSizes.md,
  };

  const sizeStyle = sizeStyles[size];
  const isGradient = variant === 'primary';

  const baseContent = (
    <View style={styles.inner}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'ghost' || variant === 'outline' ? Colors.purple : '#fff'}
        />
      ) : (
        <>
          {icon && <View style={styles.iconWrap}>{icon}</View>}
          <Text
            style={[
              styles.text,
              { fontSize: textSizes[size] },
              variant === 'ghost' && styles.ghostText,
              variant === 'outline' && styles.outlineText,
              variant === 'gold' && styles.goldText,
              variant === 'green' && styles.greenText,
              variant === 'danger' && styles.dangerText,
              variant === 'secondary' && styles.secondaryText,
              textStyle,
            ]}
          >
            {children}
          </Text>
        </>
      )}
    </View>
  );

  if (isGradient) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        disabled={disabled || loading}
        style={[{ borderRadius: sizeStyle.borderRadius }, fullWidth && styles.fullWidth, style]}
      >
        <LinearGradient
          colors={disabled ? ['#3a3a5a', '#2a2a4a'] : ['#7c3aed', '#2563eb']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.base, sizeStyle, styles.primaryBg]}
        >
          {baseContent}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      disabled={disabled || loading}
      style={[
        styles.base,
        sizeStyle,
        variant === 'secondary' && styles.secondaryBg,
        variant === 'ghost' && styles.ghostBg,
        variant === 'outline' && styles.outlineBg,
        variant === 'gold' && styles.goldBg,
        variant === 'green' && styles.greenBg,
        variant === 'danger' && styles.dangerBg,
        disabled && styles.disabled,
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {baseContent}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconWrap: {
    marginRight: 2,
  },
  text: {
    fontFamily: Fonts.body,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },
  primaryBg: {
    // handled by LinearGradient
  },
  secondaryBg: {
    backgroundColor: Colors.purpleDim,
    borderWidth: 1,
    borderColor: Colors.borderHi,
  },
  secondaryText: { color: Colors.purpleLight },
  ghostBg: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ghostText: { color: Colors.textSecondary },
  outlineBg: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.purple,
  },
  outlineText: { color: Colors.purple },
  goldBg: {
    backgroundColor: Colors.goldDim,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  goldText: { color: Colors.gold },
  greenBg: {
    backgroundColor: Colors.greenDim,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  greenText: { color: Colors.green },
  dangerBg: {
    backgroundColor: Colors.redDim,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  dangerText: { color: Colors.red },
  disabled: { opacity: 0.45 },
  fullWidth: { width: '100%' },
});
