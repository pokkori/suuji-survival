import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CellContent, ThemeColors, NumberValue } from '../types';
import { CELL_SIZE } from '../constants/grid';
import { SPECIAL_BLOCK_ICONS, SPECIAL_BLOCK_COLORS } from '../engine/specialBlocks';

interface Props {
  nextRows: CellContent[][];
  colors: ThemeColors;
}

const PREVIEW_SIZE = 28;

export const NextQueue: React.FC<Props> = ({ nextRows, colors }) => {
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.cellTextColor }]}>NEXT:</Text>
      <View style={styles.rows}>
        {nextRows.slice(0, 2).map((row, rowIdx) => (
          <View key={rowIdx} style={styles.row}>
            {row.map((cell, colIdx) => {
              if (cell.type === 'empty') {
                return <View key={colIdx} style={styles.emptyPreview} />;
              }
              const bgColor = cell.type === 'number'
                ? colors.cellColors[cell.value]
                : SPECIAL_BLOCK_COLORS[cell.special];
              const label = cell.type === 'number'
                ? String(cell.value)
                : SPECIAL_BLOCK_ICONS[cell.special];

              return (
                <View key={colIdx} style={[styles.preview, { backgroundColor: bgColor }]}>
                  <Text style={[styles.previewText, { color: colors.cellTextColor }]}>
                    {label}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  rows: {
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    gap: 2,
  },
  preview: {
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyPreview: {
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
  },
});
