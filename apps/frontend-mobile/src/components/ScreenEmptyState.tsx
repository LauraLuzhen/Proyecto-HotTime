import { StyleProp, Text, TextStyle, View, ViewStyle } from "react-native";

import { screenSharedStyles as styles } from "../lib/mobileStyles";

type Props = {
  title: string;
  detail: string;
  dashed?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  detailStyle?: StyleProp<TextStyle>;
};

export function ScreenEmptyState({ title, detail, dashed, containerStyle, titleStyle, detailStyle }: Props) {
  return (
    <View style={[styles.emptyState, dashed && styles.emptyStateDashed, containerStyle]}>
      <Text style={[styles.emptyStateTitle, titleStyle]}>{title}</Text>
      <Text style={[styles.emptyStateDetail, detailStyle]}>{detail}</Text>
    </View>
  );
}
