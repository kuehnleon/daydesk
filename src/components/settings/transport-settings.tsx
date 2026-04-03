'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react'
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
import { useTransportSettings } from '@/hooks/useTransportSettings'
import type { Transport } from '@/types'

function SortableTransportItem({
  transport,
  onEdit,
  onRemove,
}: {
  transport: Transport
  onEdit: (transport: Transport) => void
  onRemove: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: transport.id })

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
      <span className="flex-1 font-medium text-text-primary">
        {transport.name}
      </span>
      <button
        onClick={() => onEdit(transport)}
        className="rounded p-1 text-text-tertiary hover:bg-surface-secondary hover:text-foreground transition-colors"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        onClick={() => onRemove(transport.id)}
        className="rounded p-1 text-gray-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

function TransportOverlayItem({ transport }: { transport: Transport }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-accent bg-surface px-3 py-2 shadow-elevated">
      <GripVertical className="h-4 w-4 text-text-tertiary" />
      <span className="flex-1 font-medium text-text-primary">
        {transport.name}
      </span>
    </div>
  )
}

interface TransportSettingsProps {
  onDataChange?: () => void
  onReady?: () => void
}

export function TransportSettings({ onDataChange, onReady }: TransportSettingsProps) {
  const {
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
  } = useTransportSettings(onDataChange)

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

  const activeTransport = activeId ? transports.find((t) => t.id === activeId) : null

  return (
    <>
      <div className="mb-6 card p-4 sm:p-8">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-primary">{t('transportMethods')}</h3>
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
          </div>
        ) : transports.length === 0 ? (
          <p className="text-sm text-text-secondary">
            {t('noTransportMethods')}
          </p>
        ) : (
          <div className="space-y-2">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={transports.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                {transports.map((transport) => (
                  <SortableTransportItem
                    key={transport.id}
                    transport={transport}
                    onEdit={openEdit}
                    onRemove={remove}
                  />
                ))}
              </SortableContext>
              <DragOverlay>
                {activeTransport ? (
                  <TransportOverlayItem transport={activeTransport} />
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 my-[calc(1rem+var(--sai-top))] max-h-[calc(100dvh-2rem-var(--sai-top)-var(--sai-bottom))] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-surface p-6 shadow-overlay">
            <h3 className="mb-4 text-lg font-semibold text-text-primary">
              {editing ? t('editTransport') : t('addTransport')}
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
                  placeholder={t('transportPlaceholder')}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-accent focus:ring-accent"
                />
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
