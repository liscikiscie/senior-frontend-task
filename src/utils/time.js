/** @param {number} ms @returns {Promise<void>} */
export function delay(ms) {
  return new Promise(function scheduleResolve(resolve) {
    setTimeout(resolve, ms)
  })
}
