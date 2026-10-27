/** 创角灵根品阶色；元素颜色仍表示五行属性。 */
const GRADE_COLORS: Record<string, string> = {
  杂灵根: 'var(--color-ink-faint)',
  伪灵根: 'var(--color-ink-faint)',
  真灵根: 'var(--color-jade)',
  上灵根: 'var(--color-azure)',
  异灵根: 'var(--color-violet-ink)',
  变异灵根: 'var(--color-violet-ink)',
  天灵根: 'var(--color-gold-ink)',
  混沌灵根: 'var(--color-cinnabar)'
}

export function linggenGradeColor(gradeName: string): string {
  return GRADE_COLORS[gradeName] ?? 'var(--color-ink-faint)'
}
