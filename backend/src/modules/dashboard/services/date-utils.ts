export function getComparisonRanges(filter: string) {
  const now = new Date();
  let currentStart: Date;
  let currentEnd: Date = now;
  let previousStart: Date;
  let previousEnd: Date;
  let label = '';

  if (filter === 'today') {
    currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - 1);
    previousEnd = new Date(currentStart);
    label = 'so với hôm qua';
  } else if (filter === '7days') {
    currentStart = new Date();
    currentStart.setDate(currentStart.getDate() - 7);
    previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - 7);
    previousEnd = currentStart;
    label = 'so với tuần trước';
  } else if (filter === '30days') {
    currentStart = new Date();
    currentStart.setDate(currentStart.getDate() - 30);
    previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - 30);
    previousEnd = currentStart;
    label = 'so với tháng trước';
  } else if (filter === 'month') {
    currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
    previousStart = new Date(currentStart);
    previousStart.setMonth(previousStart.getMonth() - 1);
    previousEnd = currentStart;
    label = 'so với tháng trước';
  } else { // 'year'
    currentStart = new Date(now.getFullYear(), 0, 1);
    previousStart = new Date(currentStart);
    previousStart.setFullYear(previousStart.getFullYear() - 1);
    previousEnd = currentStart;
    label = 'so với năm trước';
  }

  return { currentStart, currentEnd, previousStart, previousEnd, label };
}
