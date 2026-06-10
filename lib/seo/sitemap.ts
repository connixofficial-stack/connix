export type PaginatedResult<T> = {
  page: T[];
  isDone: boolean;
  continueCursor: string | null;
};

export const collectPaginated = async <T>(
  fetchPage: (cursor: string | null) => Promise<PaginatedResult<T>>,
  maxIterations = 200
): Promise<T[]> => {
  const results: T[] = [];
  let cursor: string | null = null;

  for (let index = 0; index < maxIterations; index += 1) {
    const page = await fetchPage(cursor);
    results.push(...page.page);

    if (page.isDone || !page.continueCursor) {
      break;
    }

    cursor = page.continueCursor;
  }

  return results;
};
