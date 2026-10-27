import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUiStore } from './ui'
import type { EquipmentInstance } from '@/types'

describe('ui store · 稀有掉落', () => {
  beforeEach(() => setActivePinia(createPinia()))

  function item(uid: string): EquipmentInstance {
    return { uid, templateId: 'b_qingyun', quality: 'spirit', tier: 3, level: 0, affixes: [{ id: 'atk1', roll: 0.5 }] }
  }

  it('入队后装备强化与词条改写不改掉落快照', () => {
    const ui = useUiStore()
    const source = item('snapshot')
    ui.showRareLoot(source, true)
    source.level = 8
    source.affixes[0]!.roll = 1
    source.affixes.push({ id: 'crit1', roll: 1 })
    expect(ui.rareLoot[0]!.item.level).toBe(0)
    expect(ui.rareLoot[0]!.item.affixes).toEqual([{ id: 'atk1', roll: 0.5 }])
    expect(ui.rareLoot[0]!.firstDiscovery).toBe(true)
  })

  it('连续掉落保留正在阅读的卡片，待展示只保留最近三件', () => {
    const ui = useUiStore()
    for (let i = 0; i < 9; i += 1) ui.showRareLoot(item(String(i)), false)
    expect(ui.rareLoot.map(drop => drop.item.uid)).toEqual(['0', '6', '7', '8'])
    ui.dismissRareLoot(ui.rareLoot[0]!.id)
    expect(ui.rareLoot[0]!.item.uid).toBe('6')
    const next = ui.rareLoot[0]!.id
    ui.dismissRareLoot(-1)
    expect(ui.rareLoot[0]!.id).toBe(next)
  })

  it('同一件不重复入队，不同实例仍分别展示', () => {
    const ui = useUiStore()
    ui.showRareLoot(item('a'), true)
    ui.showRareLoot(item('a'), false)
    ui.showRareLoot(item('b'), false)
    expect(ui.rareLoot.map(drop => drop.item.uid)).toEqual(['a', 'b'])
    expect(ui.rareLoot[0]!.firstDiscovery).toBe(true)
  })
})

describe('ui store · Toast', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('toast 落队列并自动生成 id', () => {
    const ui = useUiStore()
    ui.toast('第一条', 'info')
    ui.toast('第二条', 'rare')
    expect(ui.toasts).toHaveLength(2)
    expect(ui.toasts[1]!.kind).toBe('rare')
    expect(ui.toasts[0]!.id).not.toBe(ui.toasts[1]!.id)
  })

  it('手动关闭只撤走目标 toast,不影响其他', () => {
    const ui = useUiStore()
    ui.toast('甲')
    ui.toast('乙')
    ui.toast('丙')
    const target = ui.toasts[1]!.id
    ui.dismissToast(target)
    expect(ui.toasts.some(t => t.id === target)).toBe(false)
    expect(ui.toasts).toHaveLength(2)
  })

  it('toast 队列封顶,超出挤掉最旧', () => {
    const ui = useUiStore()
    for (let i = 0; i < 8; i += 1) ui.toast(`第${i}条`)
    expect(ui.toasts).toHaveLength(5)
  })

  it('关闭不存在的 id 静默无事', () => {
    const ui = useUiStore()
    ui.toast('唯一')
    ui.dismissToast(99999)
    expect(ui.toasts).toHaveLength(1)
  })

  it('同文案去重:连弹两条一模一样的只留一条,并刷新到队尾', () => {
    const ui = useUiStore()
    ui.toast('道源不足 10', 'warn')
    ui.toast('道源不足 10', 'warn')
    expect(ui.toasts).toHaveLength(1)
    expect(ui.toasts[0]!.text).toBe('道源不足 10')
    // 更长的失败文案另起一条
    ui.toast('道源不足 100', 'warn')
    expect(ui.toasts).toHaveLength(2)
  })

  it('仅文案同、类别不同不算重复(正式与警示各留一条)', () => {
    const ui = useUiStore()
    ui.toast('结算完毕', 'info')
    ui.toast('结算完毕', 'rare')
    expect(ui.toasts).toHaveLength(2)
  })

  it('去重刷新后按新 TTL 存活:旧计时器不会提前收走刷新那条', () => {
    vi.useFakeTimers()
    try {
      const ui = useUiStore()
      ui.toast('提示', 'info') // ttl 2600ms,旧触点 t=2600
      vi.advanceTimersByTime(1000)
      ui.toast('提示', 'info') // 原位刷新,新触点 t=3600
      vi.advanceTimersByTime(600)
      expect(ui.toasts.some(t => t.text === '提示')).toBe(true)
      vi.advanceTimersByTime(1001) // t=2601:旧触点已过
      expect(ui.toasts.some(t => t.text === '提示')).toBe(true)
      vi.advanceTimersByTime(999) // t=3600:新触点
      expect(ui.toasts.some(t => t.text === '提示')).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it('手动关闭与超时收起同路:点掉后计时器撤除,不再有空转回调', () => {
    vi.useFakeTimers()
    try {
      const ui = useUiStore()
      ui.toast('点掉我', 'info')
      const id = ui.toasts[0]!.id
      ui.dismissToast(id)
      vi.advanceTimersByTime(10_000) // 早过了原 TTL
      expect(ui.toasts).toHaveLength(0)
    } finally {
      vi.useRealTimers()
    }
  })
})
