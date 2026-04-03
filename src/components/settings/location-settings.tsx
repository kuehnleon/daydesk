'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Pencil, Trash2, GripVertical, Eye, EyeOff } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Skeleton } from '@/components/ui/skeleton'
import { useLocationSettings, COLOR_OPTIONS } from '@/hooks/useLocationSettings'
import type { Location } from '@/types'

function SortableLocationItem({
  location,
  isHidden,
  onEdit,
  onRemove,
  onToggleVisibility,
  t,
}: {
  location: Location
  isHidden: boolean
  onEdit: (location: Location) => void
  onRemove: (id: string) => void
  onToggleVisibility: (id: string) => void
  t: ReturnType<typeof useTranslations<'settings'>>
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: location.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border border-border bg-surface-secondary px-3 py-2 ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <button
        className="touch-none cursor-grab active:cursor-grabbing p-0.5 text-text-tertiary hover:text-text-secondary"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div
        className="h-4 w-4 rounded"
        style={{ backgroundColor: location.color }}
      />
      <span className="flex-1 font-medium text-text-primary">
        {location.name}
      </span>
      <span className="text-sm text-text-secondary">
        {location.transport?.name || t('noTransport')}
      </span>
      {location.distance && (
        <span className="text-sm text-text-secondary">
          {location.distance} km
        </span>
      )}
      <button
        onClick={() => onToggleVisibility(location.id)}
        className="rounded p-1 text-text-tertiary hover:bg-surface-secondary hover:text-foreground transition-colors"
        title={t('showOnDashboard')}
      >
        {isHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
      <button
        onClick={() => onEdit(location)}
        className="rounded p-1 text-text-tertiary hover:bg-surface-secondary hover:text-foreground transition-colors"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        onClick={() => onRemove(location.id)}
        className="rounded p-1 text-gray-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

function LocationOverlayItem({ location, t }: { location: Location; t: ReturnType<typeof useTranslations<'settings'>> }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-accent bg-surface px-3 py-2 shadow-elevated">
      <GripVertical className="h-4 w-4 text-text-tertiary" />
      <div
        className="h-4 w-4 rounded"
        style={{ backgroundColor: location.color }}
      />
      <span className="flex-1 font-medium text-text-primary">
        {location.name}
      </span>
      <span className="text-sm text-text-secondary">
        {location.transport?.name || t('noTransport')}
      </span>
      {location.distance && (
        <span className="text-sm text-text-secondary">
          {location.distance} km
        </span>
      )}
    </div>
  )
}

const BUILT_IN_ITEMS = [
  { id: 'home', colorClass: 'bg-emerald-500', labelKey: 'homeOffice' as const },
  { id: 'off', colorClass: 'bg-amber-500', labelKey: 'dayOff' as const },
  { id: 'sick', colorClass: 'bg-red-500', labelKey: 'sickLeave' as const },
]

interface LocationSettingsProps {
  onReady?: () => void
  dashboardHidden: Set<string>
  onToggleVisibility: (id: string) => void
}

export function LocationSettings({ onReady, dashboardHidden, onToggleVisibility }: LocationSettingsProps) {
  const {
    locations,
    transports,
    isLoading,
    showModal,
    setShowModal,
    editing,
    form,
    setForm,
    openAdd,
    openEdit,
    save,
    reorder,
    remove,
  } = useLocationSettings()

  const t = useTranslations('settings')
  const onReadyRef = useRef(onReady)
  const calledRef = useRef(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    if (!isLoading && !calledRef.current) {
      calledRef.current = true
      onReadyRef.current?.()
    }
  }, [isLoading])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (over && active.id !== over.id) {
      reorder(active.id as string, over.id as string)
    }
  }

  const activeLocation = activeId ? locations.find((l) => l.id === activeId) : null

  return (
    <>
      <div className="mb-6 card p-4 sm:p-8">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-primary">{t('yourLocations')}</h3>
          <button
            onClick={openAdd}
            className="flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            <Plus className="h-4 w-4" />
            {t('add')}
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-10 rounded-lg" />
          </div>
        ) : (
          <div className="space-y-2">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={locations.map((l) => l.id)}
                strategy={verticalListSortingStrategy}
              >
                {locations.map((location) => (
                  <SortableLocationItem
                    key={location.id}
                    location={location}
                    isHidden={dashboardHidden.has(location.id)}
                    onEdit={openEdit}
                    onRemove={remove}
                    onToggleVisibility={onToggleVisibility}
                    t={t}
                  />
                ))}
              </SortableContext>
              <DragOverlay>
                {activeLocation ? (
                  <LocationOverlayItem location={activeLocation} t={t} />
                ) : null}
              </DragOverlay>
            </DndContext>

            {/* Built-in items */}
            {BUILT_IN_ITEMS.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface-secondary px-3 py-2"
              >
                <GripVertical className="h-4 w-4 text-transparent" />
                <div className={`h-4 w-4 rounded ${item.colorClass}`} />
                <span className="flex-1 font-medium text-text-primary">
                  {t(item.labelKey)}
                </span>
                <span className="text-xs text-text-tertiary">
                  {t('builtIn')}
                </span>
                <button
                  onClick={() => onToggleVisibility(item.id)}
                  className="rounded p-1 text-text-tertiary hover:bg-surface-secondary hover:text-foreground transition-colors"
                  title={t('showOnDashboard')}
                >
                  {dashboardHidden.has(item.id) ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 my-[calc(1rem+var(--sai-top))] max-h-[calc(100dvh-2rem-var(--sai-top)-var(--sai-bottom))] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-surface p-6 shadow-overlay">
            <h3 className="mb-4 text-lg font-semibold text-text-primary">
              {editing ? t('editLocation') : t('addLocation')}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-text-secondary">
                  {t('name')}
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t('locationPlaceholder')}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-accent focus:ring-accent"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-text-secondary">
                  {t('defaultTransport')}
                </label>
                <select
                  value={form.transportId}
                  onChange={(e) => setForm({ ...form, transportId: e.target.value })}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-accent focus:ring-accent"
                >
                  <option value="">{t('none')}</option>
                  {transports.map((tr) => (
                    <option key={tr.id} value={tr.id}>
                      {tr.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-text-secondary">
                  {t('distance')}
                </label>
                <input
                  type="number"
                  value={form.distance}
                  onChange={(e) => setForm({ ...form, distance: e.target.value })}
                  placeholder={t('distancePlaceholder')}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-accent focus:ring-accent"
                />
                <p className="mt-1 text-xs text-text-tertiary">
                  {t('distanceHelp')}
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-text-secondary">
                  {t('color')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setForm({ ...form, color })}
                      className={`h-8 w-8 rounded-lg transition-transform ${
                        form.color === color
                          ? 'scale-110 ring-2 ring-offset-2 ring-accent'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
              >
                {t('cancel')}
              </button>
              <button
                onClick={save}
                className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                {editing ? t('save') : t('add')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
