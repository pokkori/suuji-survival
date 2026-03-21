import { Dimensions } from 'react-native';

export const COLS = 6;
export const ROWS = 10;
export const GRID_PADDING = 16;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
export const CELL_SIZE = Math.floor((SCREEN_WIDTH - GRID_PADDING * 2) / COLS);
export const GRID_WIDTH = CELL_SIZE * COLS;
export const GRID_HEIGHT = CELL_SIZE * ROWS;

export const HEADER_HEIGHT = 140;
