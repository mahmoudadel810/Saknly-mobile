import { Text as NativeText, type TextProps } from 'react-native';

/**
 * React Native's Text with the app font. React Native has no font inheritance, so every text in
 * the app goes through this. `font-normal` comes first in the stylesheet, so a weight class in
 * `className` (font-medium, font-semibold, font-bold) still wins.
 */
export function Text({ className, ...props }: TextProps) {
  return (
    <NativeText className={className ? `font-normal ${className}` : 'font-normal'} {...props} />
  );
}
