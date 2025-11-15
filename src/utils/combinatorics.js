export function getCombinations(array, size) {
  const result = [];
  (function helper(start, combo) {
    if (combo.length === size) {
      result.push([...combo]);
      return;
    }
    for (let i = start; i < array.length; i++) {
      combo.push(array[i]);
      helper(i + 1, combo);
      combo.pop();
    }
  })(0, []);
  return result;
}
