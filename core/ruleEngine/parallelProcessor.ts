/**
 * Parallel Processing Utilities
 * Provides controlled parallel execution with concurrency limits
 */

/**
 * Process items in parallel with a concurrency limit
 * @param items - Array of items to process
 * @param processor - Async function to process each item
 * @param maxConcurrency - Maximum number of concurrent operations (default: 10)
 * @returns Array of results in the same order as input items
 */
export async function processInParallel<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  maxConcurrency: number = 10
): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<void>[] = [];
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const index = i;
    
    // Create a promise for this item
    const promise = processor(item).then(result => {
      results[index] = result;
    });
    
    executing.push(promise);
    
    // If we've reached max concurrency, wait for one to complete
    if (executing.length >= maxConcurrency) {
      await Promise.race(executing);
      // Remove completed promises
      const stillExecuting = executing.filter(p => {
        let completed = false;
        p.then(() => { completed = true; }).catch(() => { completed = true; });
        return !completed;
      });
      executing.length = 0;
      executing.push(...stillExecuting);
    }
  }
  
  // Wait for all remaining promises to complete
  await Promise.all(executing);
  
  return results;
}

/**
 * Process items in batches
 * @param items - Array of items to process
 * @param processor - Async function to process each item
 * @param batchSize - Number of items to process in each batch
 * @returns Array of results in the same order as input items
 */
export async function processInBatches<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = 10
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }
  
  return results;
}
