import { memo, useMemo } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { Grid } from 'react-window';

import { useMobileDetection } from '../../hooks';

/**
 * Virtualized Grid Component for optimal performance with large datasets
 * Uses react-window for efficient rendering of only visible items
 */
const VirtualizedGrid = memo(({
  items = [],
  renderItem,
  itemHeight = 300,
  itemWidth = 320,
  gap = 24,
  className = '',
  overscan = 5,
  ...props
}) => {
  const { isMobile, screenSize } = useMobileDetection();

  // Calculate grid dimensions based on screen size
  const gridConfig = useMemo(() => {
    const getColumnsForScreen = () => {
      if (isMobile) return 1;

      switch (screenSize) {
        case 'xs':
        case 'sm':
          return 1;
        case 'md':
          return 2;
        case 'lg':
          return 3;
        case 'xl':
        case '2xl':
        default:
          return 4;
      }
    };

    const columns = getColumnsForScreen();
    const rows = Math.ceil(items.length / columns);

    return {
      columns,
      rows,
      itemsPerRow: columns
    };
  }, [isMobile, screenSize, items.length]);

  // Cell renderer for react-window
  const Cell = memo(({ columnIndex, rowIndex, style }) => {
    const itemIndex = rowIndex * gridConfig.columns + columnIndex;
    const item = items[itemIndex];

    if (!item) {
      return <div style={style} />;
    }

    return (
      <div
        style={{
          ...style,
          padding: gap / 2,
          left: style.left + gap / 2,
          top: style.top + gap / 2,
          width: style.width - gap,
          height: style.height - gap,
        }}
      >
        {renderItem(item, itemIndex)}
      </div>
    );
  });

  Cell.displayName = 'VirtualizedGridCell';

  // If no items, show empty state
  if (items.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <p className="text-gray-500 dark:text-gray-400">No items to display</p>
      </div>
    );
  }

  return (
    <div className={`w-full h-full ${className}`} {...props}>
      <AutoSizer>
        {({ height, width }) => (
          <Grid
            columnCount={gridConfig.columns}
            columnWidth={itemWidth + gap}
            height={height}
            rowCount={gridConfig.rows}
            rowHeight={itemHeight + gap}
            width={width}
            overscanRowCount={overscan}
            overscanColumnCount={overscan}
          >
            {Cell}
          </Grid>
        )}
      </AutoSizer>
    </div>
  );
});

VirtualizedGrid.displayName = 'VirtualizedGrid';

export default VirtualizedGrid;

/**
 * Virtualized List Component for single-column layouts
 */
export const VirtualizedList = memo(({
  items = [],
  renderItem,
  itemHeight = 80,
  gap = 8,
  className = '',
  overscan = 5,
  ...props
}) => {
  const Cell = memo(({ index, style }) => {
    const item = items[index];

    return (
      <div
        style={{
          ...style,
          paddingBottom: gap,
          height: style.height - gap,
        }}
      >
        {renderItem(item, index)}
      </div>
    );
  });

  Cell.displayName = 'VirtualizedListCell';

  if (items.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <p className="text-gray-500 dark:text-gray-400">No items to display</p>
      </div>
    );
  }

  return (
    <div className={`w-full h-full ${className}`} {...props}>
      <AutoSizer>
        {({ height, width }) => (
          <Grid
            columnCount={1}
            columnWidth={width}
            height={height}
            rowCount={items.length}
            rowHeight={itemHeight + gap}
            width={width}
            overscanRowCount={overscan}
          >
            {Cell}
          </Grid>
        )}
      </AutoSizer>
    </div>
  );
});

VirtualizedList.displayName = 'VirtualizedList';
