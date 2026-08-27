export type QueryResult = {
  data: unknown;
  error: { message: string } | null;
};

/** Thenable PostgREST-style builder that resolves to a fixed result. */
export function queryChain(result: QueryResult) {
  const builder: Record<string, unknown> = {};
  const self = () => builder;
  for (const method of [
    "select",
    "insert",
    "update",
    "upsert",
    "delete",
    "eq",
    "neq",
    "in",
    "is",
    "gte",
    "lte",
    "gt",
    "lt",
    "order",
    "limit",
    "filter",
    "match",
  ]) {
    builder[method] = self;
  }
  builder.single = async () => result;
  builder.maybeSingle = async () => result;
  builder.then = (
    resolve: (value: QueryResult) => unknown,
    reject?: (reason: unknown) => unknown,
  ) => Promise.resolve(result).then(resolve, reject);
  return builder;
}

export function okResult(data: unknown): QueryResult {
  return { data, error: null };
}

export function errResult(message: string): QueryResult {
  return { data: null, error: { message } };
}

/**
 * Minimal supabase client with per-table query results.
 * `tableResults` values may be a fixed result or a function of call index.
 */
export function mockFromClient(
  tableResults: Record<
    string,
    QueryResult | QueryResult[] | ((call: number) => QueryResult)
  >,
) {
  const callCounts = new Map<string, number>();
  return {
    from(table: string) {
      const count = callCounts.get(table) ?? 0;
      callCounts.set(table, count + 1);
      const configured = tableResults[table];
      let result: QueryResult;
      if (typeof configured === "function") {
        result = configured(count);
      } else if (Array.isArray(configured)) {
        result =
          configured[Math.min(count, configured.length - 1)] ?? okResult(null);
      } else if (configured) {
        result = configured;
      } else {
        result = okResult([]);
      }
      return queryChain(result);
    },
  };
}
