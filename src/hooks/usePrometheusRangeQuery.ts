// src/hooks/usePrometheusRangeQuery.ts
import { useState, useEffect } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';

const BACKEND_URL = 'http://localhost:3002';

/**
 * Extracts the base metric name from a PromQL query string.
 * This is a best-effort extraction and may not cover all complex cases.
 * e.g., "rate(my_metric{foo="bar"}[5m])" -> "my_metric"
 * e.g., "my_metric{foo="bar"}" -> "my_metric"
 * @param query The PromQL query string.
 * @param labels The labels from the Prometheus series.
 * @returns The extracted metric name, or the original query as a fallback.
 */
function extractMetricName(query: string, labels: Record<string, string>): string {
    // Try to find a metric name inside a common function like rate(), increase(), etc.
    // This looks for a function name, an opening parenthesis, and then captures the metric name.
    let baseName: string;
    let match = query.match(/(?:rate|increase|irate|sum|avg|count)\(([\w_:]+)/);
    if (match && match[1]) {
        baseName = match[1];
    } else {
        // Fallback for a simple metric selector at the start of the query, e.g., "my_metric{...}"
        match = query.match(/^([\w_:]+)/);
        if (match && match[1]) {
            baseName = match[1];
        } else {
            // If all else fails, return the original query as a fallback
            baseName = query;
        }
    }

    // Create a unique name from the metric name and its labels
    const labelParts = Object.entries(labels)
        .filter(([key]) => key !== '__name__') // The base name is already handled
        // .sort(([keyA], [keyB]) => keyA.localeCompare(keyB)) // Sort for consistent naming
        .map(([key, value]) => `${key}_${value}`);
// console.log(labelParts);

    return [baseName, ...labelParts].join('__');
}

export interface PrometheusSeries {
  labels: Record<string, string>;
  timestamps: number[];
  values: (number | null)[];
  queryId: string;
}

export interface QueryWithId {
  id: string;
  query: string;
}

export const usePrometheusRangeQuery = (queries: QueryWithId[]) => {
  const [data, setData] = useState<PrometheusSeries[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If there are no valid queries, do nothing.
    if (queries.length === 0 || queries.every(q => q.query.trim() === '')) {
        setData(null);
        setLoading(false);
        return;
    }

    const fetchMetrics = async () => {
      setLoading(true);
      setError(null);
      try {
        const end = new Date();
        const start = dayjs(end).subtract(30, 'minutes').toDate();

        // Fetch all queries in parallel, filtering out empty ones
        const filteredQueries = queries.filter(q => q.query.trim() !== '');
        const promises = filteredQueries.map(({ query }) =>
          axios.get(`${BACKEND_URL}/api/metrics/range`, {
            params: { query, start: start.toISOString(), end: end.toISOString(), step: '15s' },
          })
        );

        const responses = await Promise.all(promises);
        // Each query can return multiple time series. We need to associate the original query with each series.
        const allSeries = responses.flatMap((res, index) => {
            const { id: queryId, query } = filteredQueries[index];
            // res.data.queryResult.result is an array of series for a single query.
            // We add the query to each series object.
            return res.data.queryResult.result.map((series: any) => ({ ...series, query, queryId }));
        });

        if (allSeries.length > 0) {
          const processedData: PrometheusSeries[] = allSeries.map(series => {
            // The 'series.metric' object from Prometheus contains the labels for the series.
            // We extract the base metric name from the query to use as __name__.
            // console.log(series);
            
            const metricName = extractMetricName(series.query, series.metric.labels);
            return {
              // We add the extracted name as __name__ and keep the full query for context.
              labels: { ...series.metric.labels, __name__: metricName, query: series.query },
              timestamps: series.values.map((v: any) => dayjs(v.time).unix()),
              values: series.values.map((v: any) => parseFloat(v.value)),
              queryId: series.queryId,
            };
          });
          setData(processedData);
        } else {
          setData(null);
        }
      } catch (err) {
        setError('Failed to fetch metrics.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [JSON.stringify(queries)]); 
  
   return { data, loading, error };
};
