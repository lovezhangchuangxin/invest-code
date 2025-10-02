/**
 * 将数字按千分位格式化
 */
export function formatNumber(num: number | string) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}
