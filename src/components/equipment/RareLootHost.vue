<template>
  <Teleport to="body">
    <div class="rare-loot-host pointer-events-none fixed inset-x-0 z-40 mx-auto w-full max-w-107.5 px-4">
      <Transition name="rare-loot" mode="out-in">
        <section
          v-if="drop && template && quality && resolved"
          :key="drop.id"
          class="rare-loot-card pointer-events-auto relative overflow-hidden rounded-xl border bg-paper p-4 text-ink"
          :style="{ '--loot-color': quality.color, '--loot-glow': tint(quality.color, 0.18), '--loot-line': tint(quality.color, 0.65) }"
          aria-label="稀有装备掉落"
          @mouseenter="hovering = true; scheduleDismiss()"
          @mouseleave="hovering = false; scheduleDismiss()"
          @focusin="focusing = true; scheduleDismiss()"
          @focusout="onFocusOut"
        >
          <div class="rare-loot-glow" aria-hidden="true" />
          <div class="rare-loot-sheen" aria-hidden="true" />
          <p class="sr-only" role="status" aria-live="polite">
            {{ drop.firstDiscovery ? '首次收录，' : '' }}拾得{{ quality.name }}{{ template.name }}
          </p>
          <div class="relative flex items-center gap-2 text-[11px]">
            <GameIcon name="sparkles" :size="13" :style="{ color: quality.color }" />
            <span class="tracking-widest text-ink-soft">珍品入囊</span>
            <span v-if="drop.firstDiscovery" class="rounded border border-gold-ink/40 bg-paper px-1.5 py-0.5 text-gold-ink">首次收录</span>
            <button
              class="-mr-1 -mt-1 ml-auto grid min-h-[28px] min-w-[28px] place-items-center rounded text-ink-faint"
              aria-label="收起掉落提示"
              @click="ui.dismissRareLoot(drop.id)"
            ><GameIcon name="x" :size="16" /></button>
          </div>
          <div class="relative mt-2 flex items-center gap-3">
            <div class="rare-loot-icon grid h-14 w-14 shrink-0 place-items-center rounded-lg border" aria-hidden="true">
              <GameIcon :name="template.icon" :size="30" :style="{ color: quality.color }" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="shrink-0 rounded border bg-paper px-1.5 py-0.5 text-[11px]" :style="{ borderColor: tint(quality.color, 0.65) }">{{ quality.name }}</span>
                <h2 class="truncate font-kai text-[18px]" :title="template.name">{{ template.name }}</h2>
              </div>
              <p class="mt-1 text-[11px] text-ink-faint">{{ EQUIP_SLOT_NAMES[template.slot] }} · {{ drop.item.tier }} 阶 · {{ resolved.affixLines.length }} 词条</p>
            </div>
          </div>
          <ul v-if="resolved.affixLines.length" class="relative mt-3 space-y-1.5 border-t border-ink/10 pt-2.5">
            <li v-for="line in resolved.affixLines.slice(0, 3)" :key="line.id" class="flex items-baseline justify-between gap-3 text-[11px] leading-relaxed">
              <span class="shrink-0 text-ink-soft">{{ line.name }}</span>
              <span class="text-right tabular text-ink">{{ line.desc }}</span>
            </li>
          </ul>
          <div class="relative mt-3 flex items-center justify-between gap-3">
            <p class="text-[10px] text-ink-faint">
              <span v-if="resolved.affixLines.length > 3">其余 {{ resolved.affixLines.length - 3 }} 条</span>
              <span v-if="ui.rareLoot.length > 1" class="ml-2">待展示 {{ ui.rareLoot.length - 1 }} 件</span>
            </p>
            <button v-if="available" class="btn-ghost !px-3 !py-1.5 text-[12px]" @click="openDetail">查看装备</button>
            <span v-else class="text-[11px] text-ink-faint">已离囊</span>
          </div>
        </section>
      </Transition>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
  import { computed, onUnmounted, ref, watch } from 'vue'
  import { useUiStore } from '@/stores/ui'
  import { useInventoryStore } from '@/stores/inventory'
  import { equipmentTemplate, EQUIP_SLOT_NAMES } from '@/data/equipment'
  import { qualityDef } from '@/data/qualities'
  import { resolveEquipStats } from '@/core/equipGen'
  import { playSfx } from '@/core/audio'
  import { tint } from '@/utils/colorToken'
  import GameIcon from '@/components/common/GameIcon.vue'

  const ui = useUiStore()
  const inventory = useInventoryStore()
  const drop = computed(() => ui.rareLoot[0])
  const template = computed(() => drop.value ? equipmentTemplate(drop.value.item.templateId) : undefined)
  const quality = computed(() => drop.value ? qualityDef(drop.value.item.quality) : undefined)
  const resolved = computed(() => drop.value ? resolveEquipStats(drop.value.item) : undefined)
  const available = computed(() => drop.value && inventory.findItem(drop.value.item.uid) !== undefined)
  let timer: ReturnType<typeof setTimeout> | undefined
  const hovering = ref(false)
  const focusing = ref(false)

  function clearTimer(): void {
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
  }

  function scheduleDismiss(): void {
    clearTimer()
    const id = drop.value?.id
    if (id === undefined || hovering.value || focusing.value) return
    timer = setTimeout(() => ui.dismissRareLoot(id), 8000)
  }

  function onFocusOut(event: FocusEvent): void {
    focusing.value = event.relatedTarget instanceof Node && (event.currentTarget as HTMLElement).contains(event.relatedTarget)
    scheduleDismiss()
  }

  function openDetail(): void {
    if (!drop.value || !available.value) return
    ui.equipDetailUid = drop.value.item.uid
    ui.dismissRareLoot(drop.value.id)
  }

  watch(() => drop.value?.id, id => {
    hovering.value = false
    focusing.value = false
    if (id !== undefined) playSfx('rare')
    scheduleDismiss()
  }, { immediate: true })
  onUnmounted(clearTimer)
</script>
