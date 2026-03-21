import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Cell as CellType, ThemeColors } from '../types';
import { CELL_SIZE } from '../constants/grid';
import { SPECIAL_BLOCK_ICONS, SPECIAL_BLOCK_COLORS } from '../engine/specialBlocks';

interface Props {
  cell: CellType;
  colors: ThemeColors;
  isDanger: boolean;
}

export const CellView: React.FC<Props> = React.memo(({ cell, colors, isDanger }) => {
  const { content, isSelected } = cell;

  if (content.type === 'empty') {
    return <View style={[styles.cell, { backgroundColor: 'transparent' }]} />;
  }

  let bgColor: string;
  let label: string;

  if (content.type === 'number') {
    bgColor = colors.cellColors[content.value];
    label = String(content.value);
  } else {
    bgColor = SPECIAL_BLOCK_COLORS[content.special];
    label = SPECIAL_BLOCK_ICONS[content.special];
  }

  return (
    <View
      style={[
        styles.cell,
        {
          backgroundColor: bgColor,
          borderColor: isSelected ? colors.swipePathColor : 'transparent',
          borderWidth: isSelected ? 3 : 0,
          opacity: isDanger ? 0.7 : 1,
        },
        isDanger && styles.danger,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: colors.cellTextColor,
            fontSize: content.type === 'special' ? CELL_SIZE * 0.4 : CELL_SIZE * 0.45,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  cell: {
    width: CELL_SIZE - 4,
    height: CELL_SIZE - 4,
    margin: 2,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: 'bold',
  },
  danger: {
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
});
