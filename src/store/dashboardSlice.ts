import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './index';

// Define the structure for a single panel
import { v4 as uuidv4 } from 'uuid';
export interface SeriesObject {
  series_name: string;
  series_rename: string;
  units: string;
  resolution: number;
}

export interface QueryObject {
  query: string;
  id: string; // Add a unique ID for each query
  series: SeriesObject[];
}

export interface PanelConfig {
  id: string;
  title: string;
  queries: QueryObject[];
}

interface DashboardState {
  panels: PanelConfig[];
}

// Initial state with some example panels
const initialState: DashboardState = {
  panels: [
    {
      id: 'cpu',
      title: 'CPU Usage',
      queries: [
        { id: uuidv4(), query: 'rate(windows_cpu_processor_utility_total{core="0,0"}[5m])', series: [] },
        { id: uuidv4(), query: 'rate(windows_cpu_time_total{core="0,0"}[5m])', series: [] },
      ],
    },
    {
      id: 'memory',
      title: 'Available Memory',
      queries: [{ id: uuidv4(), query: 'rate(windows_cpu_processor_utility_total{core="0,0"}[5m])', series: [] }],
    },
    { id: 'network', title: 'Network Ingress', queries: [{ id: uuidv4(), query: 'rate(windows_cpu_processor_utility_total{core="0,0"}[5m])', series: [] }] },
  ],
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setDashboardState: (state, action: PayloadAction<DashboardState>) => {
      // Replace the entire dashboard state with the payload
      state.panels = action.payload.panels;
    },
    addPanel: state => {
      const newPanelId = uuidv4();
      state.panels.push({
        id: newPanelId,
        title: 'New Panel',
        queries: [{ id: uuidv4(), query: '', series: [] }],
      });
    },
    updatePanelFromFile: (state, action: PayloadAction<{ panelId: string; panelConfig: Omit<PanelConfig, 'id'> }>) => {
      const { panelId, panelConfig } = action.payload;
      const panel = state.panels.find(p => p.id === panelId);
      if (panel) {
        panel.title = panelConfig.title;
        // Assign new IDs to queries to prevent potential ID conflicts
        panel.queries = panelConfig.queries.map(q => ({
          ...q,
          id: uuidv4(),
        }));
      }
    },
    addQuery: (state, action: PayloadAction<{ panelId: string }>) => {
      const panel = state.panels.find(p => p.id === action.payload.panelId);
      if (panel) {
        panel.queries.push({ id: uuidv4(), query: '', series: [] }); // Generate unique ID
      }
    },
    updateQuery: (state, action: PayloadAction<{ panelId: string; queryId: string; query: string }>) => {
      const panel = state.panels.find(p => p.id === action.payload.panelId);
      if (panel) {
        const queryObj = panel.queries.find(q => q.id === action.payload.queryId);
        if (queryObj) {
          queryObj.query = action.payload.query;
        }
      }
    },
    removeQuery: (state, action: PayloadAction<{ panelId: string; queryId: string }>) => {
      const panel = state.panels.find(p => p.id === action.payload.panelId);
      if (panel) {
        panel.queries = panel.queries.filter(q => q.id !== action.payload.queryId);
      }
    },
    deletePanel: (state, action: PayloadAction<{ panelId: string }>) => {
      state.panels = state.panels.filter(p => p.id !== action.payload.panelId);
    },
    setSeriesForQuery: (state, action: PayloadAction<{ panelId: string; queryId: string; seriesNames: string[] }>) => {
      const panel = state.panels.find(p => p.id === action.payload.panelId);
      if (panel) {
        const queryObj = panel.queries.find(q => q.id === action.payload.queryId);
        if (queryObj) {
          const existingSeries = queryObj.series;
          const newSeriesNames = action.payload.seriesNames;

          // Ensure newSeriesNames are unique to prevent duplicate entries
          const uniqueNewSeriesNames = Array.from(new Set(newSeriesNames));

          const newSeries = uniqueNewSeriesNames.map(name => {
            const existing = existingSeries.find(s => s.series_name === name);
            return existing || { series_name: name, series_rename: name, units: '', resolution: 2 };
          });

          // Prevent infinite loops by checking if the series data has actually changed.
          const isUnchanged = existingSeries.length === newSeries.length &&
            existingSeries.every((s, i) =>
              s.series_name === newSeries[i].series_name && s.series_rename === newSeries[i].series_rename &&
              s.units === newSeries[i].units && s.resolution === newSeries[i].resolution
            );

          if (!isUnchanged) {
            queryObj.series = newSeries;
          }
        }
      }
    },
    updateSeriesRename: (state, action: PayloadAction<{ panelId: string; queryId: string; seriesName: string; newRename: string }>) => {
      const { panelId, queryId, seriesName, newRename } = action.payload;
      const panel = state.panels.find(p => p.id === panelId);
      if (panel) {
        const queryObj = panel.queries.find(q => q.id === queryId);
        if (queryObj) {
          const series = queryObj.series.find(s => s.series_name === seriesName);
          if (series) {
            series.series_rename = newRename;
          }
        }
      }
    },
    updateSeriesOverrides: (state, action: PayloadAction<{ panelId: string; queryId: string; seriesName: string; overrides: Partial<Pick<SeriesObject, 'units' | 'resolution'>> }>) => {
      const { panelId, queryId, seriesName, overrides } = action.payload;
      const panel = state.panels.find(p => p.id === panelId);
      if (panel) {
        const queryObj = panel.queries.find(q => q.id === queryId);
        if (queryObj) {
          const series = queryObj.series.find(s => s.series_name === seriesName);
          if (series) {
            Object.assign(series, overrides);
          }
        }
      }
    },
    updatePanelTitle: (state, action: PayloadAction<{ panelId: string; title: string }>) => {
      const { panelId, title } = action.payload;
      const panel = state.panels.find(p => p.id === panelId);
      if (panel) {
        panel.title = title;
      }
    },
  },
});

export const { setDashboardState, addPanel, updatePanelFromFile, addQuery, updateQuery, removeQuery, deletePanel, setSeriesForQuery, updateSeriesRename, updateSeriesOverrides, updatePanelTitle } =
  dashboardSlice.actions;

// Selector to get a panel by its ID
export const selectPanelById = (state: RootState, panelId: string) =>
  state.dashboard.panels.find(p => p.id === panelId);

export default dashboardSlice.reducer;
