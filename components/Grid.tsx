import React, { useRef, useCallback } from 'react';
import { View, StyleSheet, PanResponder, LayoutChangeEvent } from 'react-native';
import { Grid as GridType, Position, ThemeColors } from '../types';
import { COLS, ROWS, CELL_SIZE, GRID_PADDING } from '../constants/grid';
import { CellView } from './Cell';

interface Props {
  grid: GridType;
  colors: ThemeColors;
  warningRowThreshold: number;
  onSwipeStart: (pos: Position) => void;
  onSwipeMove: (pos: Position) => void;
  onSwipeEnd: () => void;
  disabled?: boolean;
}

export const GridView: React.FC<Props> = ({
  grid,
  colors,
  warningRowThreshold,
  onSwipeStart,
  onSwipeMove,
  onSwipeEnd,
  disabled,
}) => {
  const gridOriginRef = useRef({ x: 0, y: 0 });
  const lastCellRef = useRef<Position | null>(null);

  const screenToGrid = useCallback((touchX: number, touchY: number): Position | null => {
    const col = Math.floor(touchX / CELL_SIZE);
    const row = Math.floor(touchY / CELL_SIZE);
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return null;
    return { row, col };
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: (evt) => {
        const touch = evt.nativeEvent;
        const localX = touch.locationX;
        const localY = touch.locationY;
        const pos = screenToGrid(localX, localY);
        if (pos) {
          lastCellRef.current = pos;
          onSwipeStart(pos);
        }
      },
      onPanResponderMove: (evt) => {
        const touch = evt.nativeEvent;
        const localX = touch.locationX;
        const localY = touch.locationY;
        const pos = screenToGrid(localX, localY);
        if (pos && (
          !lastCellRef.current ||
          pos.row !== lastCellRef.current.row ||
          pos.col !== lastCellRef.current.col
        )) {
          lastCellRef.current = pos;
          onSwipeMove(pos);
        }
      },
      onPanResponderRelease: () => {
        lastCellRef.current = null;
        onSwipeEnd();
      },
      onPanResponderTerminate: () => {
        lastCellRef.current = null;
        onSwipeEnd();
      },
    })
  ).current;

  // Determine danger rows
  const highestOccupiedRow = (() => {
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (grid[row][col].content.type !== 'empty') return row;
      }
    }
    return ROWS;
  })();

  return (
    <View
      style={[styles.grid, { backgroundColor: colors.gridBackground }]}
      {...panResponder.panHandlers}
    >
      {grid.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((cell, colIndex) => (
            <CellView
              key={cell.id}
              cell={cell}
              colors={colors}
              isDanger={rowIndex <= 1 && cell.content.type !== 'empty'}
            />
          ))}
        </View>
      ))}
      {/* Grid lines */}
      {Array.from({ length: ROWS + 1 }, (_, i) => (
        <View
          key={`h-${i}`}
          style={[
            styles.hLine,
            { top: i * CELL_SIZE, backgroundColor: colors.gridLine },
          ]}
        />
      ))}
      {Array.from({ length: COLS + 1 }, (_, i) => (
        <View
          key={`v-${i}`}
          style={[
            styles.vLine,
            { left: i * CELL_SIZE, backgroundColor: colors.gridLine },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    width: CELL_SIZE * COLS,
    height: CELL_SIZE * ROWS,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  row: {
    flexDirection: 'row',
  },
  hLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.3,
  },
  vLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    opacity: 0.3,
  },
});
