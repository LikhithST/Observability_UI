import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { usePrometheusRangeQuery, PrometheusSeries } from '../hooks/usePrometheusRangeQuery';
import uPlot, { AlignedData, Options } from 'uplot';
import UplotReact from 'uplot-react';
import 'uplot/dist/uPlot.min.css';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { IconButton, Box } from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import { QueryObject as StoreQueryObject } from '../store/dashboardSlice';

const colorPalette = [
    '#7EB26D', // green
    '#EAB839', // yellow
    '#6ED0E0', // cyan
    '#EF843C', // orange
    '#E24D42', // red
    '#1F78C1', // blue
    '#BA43A9', // purple
    '#705DA0', // dark purple
];

const hexToRgba = (hex: string, alpha: number): string => {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
        return `rgba(0, 0, 0, ${alpha})`; // fallback for invalid hex
    }
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const formatScientific = (value: number, resolution: number): string => {
    if (value === 0) return `0.${'0'.repeat(resolution)}`; // Handle zero case

    const suffixes: { [key: number]: string } = {
        '4': 'T', '3': 'B', '2': 'M', '1': 'K', '0': '',
        '-1': 'm', '-2': 'μ', '-3': 'n', '-4': 'p'
    };

    const sign = value < 0 ? "-" : "";
    const absValue = Math.abs(value);
    
    const tier = Math.floor(Math.log10(absValue) / 3);

    if (suffixes[tier]) {
        const suffix = suffixes[tier] || '';
        const scale = Math.pow(10, tier * 3);
        const scaledValue = absValue / scale;
        return sign + scaledValue.toFixed(resolution) + suffix;
    }

    return value.toExponential(resolution);
};

/**
 * Creates a uPlot-compatible AlignedData array from an array of Prometheus series.
 * It assumes all series share the same timestamps from the first series.
 * NOTE: For series with different timestamps, a more sophisticated joining/merging strategy would be needed.
 */
const toAlignedData = (series: PrometheusSeries[]): AlignedData => {
    if (!series || series.length === 0) {
        return [[], []];
    }

    const timestamps = series[0].timestamps;
    const values = series.map(s => s.values);

    return [timestamps, ...values];
};

/**
 * Generates a compact display label for a series for the legend.
 * e.g., {__name__: "metric", instance: "localhost:9090", ...} -> "metric{instance="localhost:9090"}"
 */
const generateLegendLabel = (metric: Record<string, string>): string => {
    const name = metric.__name__ || '';
    const labels = Object.entries(metric)
        .filter(([key]) => key !== '__name__' && key !== 'query') // Exclude verbose labels
        .map(([key, value]) => `${key}="${value}"`)
        .join(', ');
    return `${name}${labels ? `{${labels}}` : ''}`;
};

type QueryObjectWithVisibility = {
    id: string;
    query: string;
    visible: boolean;
    series: StoreQueryObject['series'];
};

const ChartPanel = ({
    query,
    title,
    onDataFetched,
}: {
    query: (string[] | QueryObjectWithVisibility[] | StoreQueryObject[]),
    title: string,
    onDataFetched?: (data: PrometheusSeries[] | null) => void
}) => {
    // This useMemo hook normalizes the `query` prop into a format suitable for usePrometheusRangeQuery, using stable IDs
    const visibleQueries = useMemo(() => {
        if (!query || query.length === 0) {
            return [];
        }
        const firstQuery = query[0];
        if (typeof firstQuery === 'string') {
            // Assign a temporary ID for fetching, but this won't be stable across refreshes/reorders
            return (query as string[]).map((q, i) => ({ id: `temp-${i}-${q}`, query: q }));
        }
        if ('visible' in firstQuery) {
            // Handle object array from EditPanelPage with visibility flags
            return (query as QueryObjectWithVisibility[]).filter(q => q.visible).map(q => ({ id: q.id, query: q.query }));
        }
        if ('series' in firstQuery) {
            // Handle object array from Dashboard page (from Redux store)
            return (query as StoreQueryObject[]).map(q => ({ id: q.id, query: q.query }));
        }
        return []; // Should not be reached
    }, [query]);

    const { data: seriesData, loading, error } = usePrometheusRangeQuery(visibleQueries);

    // This effect passes the fetched data up to the parent component.
    useEffect(() => {
        if (onDataFetched) {
            onDataFetched(seriesData);
        }
    }, [seriesData, onDataFetched]);
    // Convert the structured series data into the flat array format uPlot expects.
    const alignedData = useMemo(() => (seriesData ? toAlignedData(seriesData) : null), [seriesData]);

    const containerRef = useRef<HTMLDivElement>(null);
    const legendContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<uPlot | null>(null);
    const [size, setSize] = useState({ width: 0, height: 0 }); 
    const [tooltipState, setTooltipState] = useState<{
        show: boolean;
        left: number;
        top: number;
        content: string;
    }>({ show: false, left: 0, top: 0, content: '' });

    // This effect observes the container's size and updates the state
    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver(entries => {
            if (entries[0]) {
                const { width, height } = entries[0].contentRect;
                // The contentRect already accounts for the container's padding.
                setSize({ width, height });
            }
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // This effect adds horizontal mouse wheel scrolling to the legend
    useEffect(() => {
        const legendEl = legendContainerRef.current;
        if (!legendEl) return;

        const handleWheel = (event: WheelEvent) => {
            if (event.deltaY === 0) return;
            // Prevent the default vertical page scroll
            event.preventDefault();
            // Apply the vertical scroll delta to the horizontal scroll position, with a multiplier for speed
            legendEl.scrollLeft += event.deltaY * 3;
        };

        legendEl.addEventListener('wheel', handleWheel, { passive: false });
        return () => legendEl.removeEventListener('wheel', handleWheel);
    }, []);

    const handleResetZoom = useCallback(() => {
        if (chartRef.current && alignedData) {
            // uPlot's setData with a second argument of `true` resets scales to auto-range over the data.
            chartRef.current.setData(alignedData, true);
        }
    }, [alignedData]);

    const handleSetCursor = useCallback((u: uPlot) => {
        // Check if cursor is outside the plot
        if (!u.cursor.left || u.cursor.left < 0) {
            setTooltipState(t => t.show ? { ...t, show: false } : t);
            return;
        }

        const { idx } = u.cursor;
        const { left, top } = u.cursor;

        // Check if cursor has a data index
        if (idx === null) {
            setTooltipState(t => t.show ? { ...t, show: false } : t);
            return;
        }

        const timestamp = u.data[0]?.[idx];

        // Check if data at index is valid
        if (timestamp === undefined) {
            setTooltipState(t => t.show ? { ...t, show: false } : t);
            return;
        }

        const date = new Date(timestamp * 1000);
        const formattedDate = new Intl.DateTimeFormat(navigator.language, {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        }).format(date);

        let content = `<div style="text-align: center;">${formattedDate}</div>`;
        let seriesInfoAdded = false;

        // Add a row for each series to the tooltip
        seriesData?.forEach((series, i) => {
            const value = u.data[i + 1]?.[idx];
            // Only show series in tooltip if it's currently visible (toggled on)
            if (value !== null && value !== undefined && u.series[i + 1].show) {
                seriesInfoAdded = true;

                // Default to the unique series name, which is stored in the '__name__' label.
                let tooltipLabel = series.labels.__name__ || 'unknown_series';
                let resolution = 2; // Default resolution
                let units = ''; // Default units

                // Try to find a user-defined alias (series_rename)
                if (query && Array.isArray(query) && query.length > 0 && typeof query[0] !== 'string') {
                    const queryObj = (query as (StoreQueryObject | QueryObjectWithVisibility)[])
                        .find(q => q.id === series.queryId);

                    if (queryObj && 'series' in queryObj && Array.isArray(queryObj.series)) {
                        const seriesObj = queryObj.series.find(s => s.series_name === series.labels.__name__);
                        if (seriesObj && seriesObj.series_rename) {
                            tooltipLabel = seriesObj.series_rename;
                        }
                        if (seriesObj) {
                            resolution = seriesObj.resolution;
                            units =  seriesObj?.units ?? '';
                        }
                    }
                }
                // Use the same color palette rotation as the series lines
                const color = colorPalette[i % colorPalette.length];
                content += `<div>
                    <span style="color: ${color};">■</span> ${tooltipLabel}: ${formatScientific(value, resolution)} ${units}
                </div>`;
            }
        });

        // If no visible series have data at this point, hide the tooltip.
        if (!seriesInfoAdded) {
            setTooltipState(t => t.show ? { ...t, show: false } : t);
            return;
        }

        const plotLeft = u.bbox.left / uPlot.pxRatio;
        const plotTop = u.bbox.top / uPlot.pxRatio;
        const containerPadding = 16; // from p-4

        const finalLeft = plotLeft + left + containerPadding;
        const finalTop = plotTop + top + containerPadding;

        setTooltipState({
            show: true,
            left: finalLeft,
            top: finalTop,
            content,
        });
    }, [seriesData, query]); // Depends on seriesData and query to access labels and aliases

    const chartOptions: Options = useMemo(() => ({
        width: size.width,
        height: size.height,
        // title,
         padding: [15, 15, 5, 15],
        select: {
            show: true,
            // The uPlot types are strict and require these properties,
            // even though they are internally managed by the library.
            // We provide dummy values to satisfy the compiler.
            left: 0,
            top: 0,
            width: 0,
            height: 0,
        },
        legend:{
            show: true,
            live: false, // We use a custom tooltip, so the legend can be static
            isolate: true, // Click to isolate a series, ctrl+click to toggle
            mount: (self, el) => {
                if (!legendContainerRef.current) return;
                legendContainerRef.current.innerHTML = '';
                // The default uPlot legend is a flex container. To make it scroll
                // horizontally, we just need to prevent it from wrapping.
                el.style.flexWrap = 'nowrap';
                legendContainerRef.current.appendChild(el);
            }
        },
        cursor: {
            drag: { x: true, y: true },
            points: {
                show: false, // Use custom tooltip, so disable default points
                size: 6,
                stroke: '#181B1F', // Match panel background
                fill: '#73bf69',   // Match line color
            },
        },
        series: [ // The first series is always the X-axis (time)
            {
                show: false, // This will hide the time value from the legend
            },
            // Dynamically create a series configuration for each data series
            ...(seriesData?.map((s, i) => {
                const color = colorPalette[i % colorPalette.length];

                // Default to the unique series name, which is stored in the '__name__' label.
                let legendLabel = s.labels.__name__ || 'unknown_series';
                let resolution = 2; // Default resolution
                let units = ''; // Default units

                // Try to find a user-defined alias (series_rename)
                if (query && Array.isArray(query) && query.length > 0 && typeof query[0] !== 'string') {
                    // Find the query object from the prop that matches the series's stable queryId
                    const queryObj = (query as (StoreQueryObject | QueryObjectWithVisibility)[])
                        .find(q => q.id === s.queryId);

                    if (queryObj && 'series' in queryObj && Array.isArray(queryObj.series)) {
                        const seriesObj = queryObj.series.find(series => series.series_name === s.labels.__name__);
                        // If a custom rename exists and isn't an empty string, use it.
                        if (seriesObj && seriesObj.series_rename) {
                            legendLabel = seriesObj.series_rename;
                        }
                        if (seriesObj) {
                            resolution = seriesObj.resolution;
                            units = seriesObj.units;
                        }
                    }
                }

                return {
                    label: legendLabel,
                    stroke: color,
                    width: 2,
                    fill: hexToRgba(color, 0.1),
                    points: { show: false },
                    value: (_: uPlot, rawValue: number) => `${formatScientific(rawValue, resolution)} ${units}`,
                };
            }) || [{
                    label: 'Value', // Default for when there's no data yet
                    stroke: '#73bf69',
            }]),
        ], 
        axes: [
            { // X-Axis (Time)
                stroke: 'white',
                font: '300 12px system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
                grid: { show: true, stroke: "rgba(204, 204, 220, 0.07)" },
            },
            { // Y-Axis (Value)
                stroke: 'white',
                font: '300 12px system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
                grid: { show: true, stroke: "rgba(204, 204, 220, 0.07)" },
                values: (u, vals) => vals.map(v => {
                    // Find the first visible series to use its formatting for the axis
                    const firstVisibleSeriesIndex = u.series.findIndex((s, i) => i > 0 && s.show);

                    if (firstVisibleSeriesIndex > 0 && seriesData && seriesData[firstVisibleSeriesIndex - 1]) {
                        const series = seriesData[firstVisibleSeriesIndex - 1];
                        const queryObj = (query as StoreQueryObject[]).find(q => q.id === series.queryId);
                        const seriesObj = queryObj?.series.find(s => s.series_name === series.labels.__name__);

                        const resolution = seriesObj?.resolution ?? 2;
                        const units = seriesObj?.units ?? '';

                        return `${formatScientific(v, resolution)}`;
                    }

                    // Fallback if no series is visible or data is not ready
                    return formatScientific(v, 2);
                }),
            },
        ],
        hooks: {
            setCursor: [handleSetCursor],
        }
    }), [size.width, size.height, handleSetCursor, seriesData, query]);

    // Custom styles to make the zoom selection box more visible on a dark theme.
    const customUplotStyles = `
        .u-select {
            background: rgba(255, 255, 255, 0.1) !important;
            border: 1px dashed #fff;
        }
        .u-legend th {
            color: white;
            font-weight: 300;
        }
    `;

    return (
        <div className="w-full h-full flex flex-col">
            <div ref={containerRef} className="flex-grow p-4 relative min-h-0">
                <style>{customUplotStyles}</style>
                {tooltipState.show && (
                <div
                    style={{
                        position: 'absolute',
                        left: tooltipState.left,
                        top: tooltipState.top - 10,
                        transform: 'translateX(-50%) translateY(-100%)',
                        pointerEvents: 'none',
                        zIndex: 100,
                        backgroundColor: 'rgba(32, 34, 38, 0.9)',
                        color: 'white',
                        fontWeight: 300,
                        padding: '8px 12px',
                        borderRadius: '4px',
                        border: '1px solid #4B5563',
                        whiteSpace: 'nowrap',
                    }}
                    dangerouslySetInnerHTML={{ __html: tooltipState.content }}
                />
                )}
                {loading && <p className="text-white text-center">Loading...</p>}
                {error && <p className="text-red-500 text-center">{error}</p>}
                {alignedData && size.width > 0 && (
                <>
                    <IconButton
                        aria-label="Reset Zoom"
                        onClick={handleResetZoom}
                        sx={{
                            position: 'absolute',
                            top: '20px',
                            right: '20px',
                            zIndex: 10,
                            backgroundColor: 'rgba(255, 255, 255, 0.15)',
                            color: '#FFF',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                            },
                        }}
                    >
                        <ReplayIcon />
                    </IconButton>
                    <UplotReact
                        options={chartOptions}
                        data={alignedData}
                        onCreate={(chart) => { chartRef.current = chart; }}
                        onDelete={() => { chartRef.current = null; }}
                    />
                </>
                )}
            </div>
            <Box
                ref={legendContainerRef}
                className="flex-shrink-0 max-h-16 overflow-x-auto overflow-y-hidden whitespace-nowrap p-2 border-t border-gray-700 bg-[#202226]"
                sx={{
                    // Webkit (Chrome, Safari, Edge)
                    '&::-webkit-scrollbar': {
                        height: '8px', // for horizontal scrollbar
                    },
                    '&::-webkit-scrollbar-track': {
                        backgroundColor: 'transparent',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: '#4B5563', // A mid-gray for the thumb
                        borderRadius: '4px',
                        '&:hover': {
                            backgroundColor: '#6B7280', // Lighter gray on hover
                        },
                    },
                    // Firefox
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#4B5563 transparent', // thumb color and track color
                }}
            >
                {/* uPlot legend will be mounted here */}
            </Box>
        </div>
    );
}

export default ChartPanel;