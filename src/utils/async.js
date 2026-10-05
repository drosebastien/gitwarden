export async function mapWithConcurrency(items, concurrency, callback, onProgress = null) {
  const results = new Array(items.length)

  let nextIndex = 0
  let completed = 0

  async function worker() {
    while (true) {
      const index = nextIndex++

      if (index >= items.length) {
        return
      }

      results[index] = await callback(items[index], index)

      completed++

      onProgress?.(completed, items.length)
    }
  }

  const workerCount = Math.min(concurrency, items.length)

  await Promise.all(Array.from({ length: workerCount }, () => worker()))

  return results
}
