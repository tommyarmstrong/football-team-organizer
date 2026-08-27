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
    "not",
    "or",
    "contains",
    "overlaps",
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
  options?: {
    rpcResults?: Record<
      string,
      QueryResult | QueryResult[] | ((call: number) => QueryResult)
    >;
  },
) {
  const callCounts = new Map<string, number>();
  const rpcCallCounts = new Map<string, number>();

  function resolveConfigured(
    configured:
      QueryResult | QueryResult[] | ((call: number) => QueryResult) | undefined,
    count: number,
    fallback: QueryResult,
  ): QueryResult {
    if (typeof configured === "function") return configured(count);
    if (Array.isArray(configured)) {
      return configured[Math.min(count, configured.length - 1)] ?? fallback;
    }
    if (configured) return configured;
    return fallback;
  }

  return {
    from(table: string) {
      const count = callCounts.get(table) ?? 0;
      callCounts.set(table, count + 1);
      return queryChain(
        resolveConfigured(tableResults[table], count, okResult([])),
      );
    },
    async rpc(fn: string) {
      const count = rpcCallCounts.get(fn) ?? 0;
      rpcCallCounts.set(fn, count + 1);
      return resolveConfigured(
        options?.rpcResults?.[fn],
        count,
        okResult(null),
      );
    },
  };
}
