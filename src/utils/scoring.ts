import type { McOption } from '@/db/schema';

export function gradeMultipleChoice(
  selectedOptions: number[] | null,
  options: McOption[] | null,
): boolean {
  if (!selectedOptions || !options) return false;

  const correctIndices = options
    .map((opt, idx) => (opt.isCorrect ? idx : -1))
    .filter((idx) => idx >= 0);

  if (correctIndices.length !== selectedOptions.length) return false;

  const sortedSelected = [...selectedOptions].sort();
  const sortedCorrect = [...correctIndices].sort();

  return sortedSelected.every((val, idx) => val === sortedCorrect[idx]);
}
