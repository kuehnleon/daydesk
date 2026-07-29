import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@/test/render'
import { useLongPress } from './useLongPress'

// Mock haptic — we don't want to depend on navigator.vibrate in JSDOM,
// and we assert it fires alongside long-press.
vi.mock('@/lib/haptic', () => ({ haptic: vi.fn() }))
import { haptic } from '@/lib/haptic'

function makeMouseEvent(button = 0): React.MouseEvent {
  return { button, preventDefault: vi.fn() } as unknown as React.MouseEvent
}
function makeTouchEvent(x: number, y: number): React.TouchEvent {
  return {
    touches: [{ clientX: x, clientY: y }],
    changedTouches: [{ clientX: x, clientY: y }],
  } as unknown as React.TouchEvent
}

describe('useLongPress', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    ;(haptic as unknown as ReturnType<typeof vi.fn>).mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('fires onLongPress after the delay and skips onClick', () => {
    const onLongPress = vi.fn()
    const onClick = vi.fn()
    const { result } = renderHook(() => useLongPress({ onLongPress, onClick }))

    act(() => result.current.onMouseDown(makeMouseEvent()))
    act(() => vi.advanceTimersByTime(500))

    expect(onLongPress).toHaveBeenCalledTimes(1)
    expect(haptic).toHaveBeenCalledTimes(1)

    // Releasing after long-press must NOT fire onClick.
    act(() => result.current.onMouseUp(makeMouseEvent()))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('fires onClick when released before the delay', () => {
    const onLongPress = vi.fn()
    const onClick = vi.fn()
    const { result } = renderHook(() => useLongPress({ onLongPress, onClick }))

    act(() => result.current.onMouseDown(makeMouseEvent()))
    act(() => vi.advanceTimersByTime(200))
    act(() => result.current.onMouseUp(makeMouseEvent()))

    expect(onLongPress).not.toHaveBeenCalled()
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('cancels on mouseleave without firing anything', () => {
    const onLongPress = vi.fn()
    const onClick = vi.fn()
    const { result } = renderHook(() => useLongPress({ onLongPress, onClick }))

    act(() => result.current.onMouseDown(makeMouseEvent()))
    act(() => vi.advanceTimersByTime(200))
    act(() => result.current.onMouseLeave())
    act(() => vi.advanceTimersByTime(500)) // pending timer should be dead

    expect(onLongPress).not.toHaveBeenCalled()
    expect(onClick).not.toHaveBeenCalled()
  })

  it('right-click (onContextMenu) triggers onLongPress', () => {
    const onLongPress = vi.fn()
    const onClick = vi.fn()
    const { result } = renderHook(() => useLongPress({ onLongPress, onClick }))

    const evt = makeMouseEvent(2)
    act(() => result.current.onContextMenu(evt))

    expect(evt.preventDefault).toHaveBeenCalled()
    expect(onLongPress).toHaveBeenCalledTimes(1)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('touch tap fires onClick and skips onLongPress', () => {
    const onLongPress = vi.fn()
    const onClick = vi.fn()
    const { result } = renderHook(() => useLongPress({ onLongPress, onClick }))

    act(() => result.current.onTouchStart(makeTouchEvent(10, 10)))
    act(() => vi.advanceTimersByTime(100))
    act(() => result.current.onTouchEnd(makeTouchEvent(12, 11)))

    expect(onLongPress).not.toHaveBeenCalled()
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('touch hold >delayMs fires onLongPress', () => {
    const onLongPress = vi.fn()
    const onClick = vi.fn()
    const { result } = renderHook(() => useLongPress({ onLongPress, onClick }))

    act(() => result.current.onTouchStart(makeTouchEvent(10, 10)))
    act(() => vi.advanceTimersByTime(500))
    act(() => result.current.onTouchEnd(makeTouchEvent(10, 10)))

    expect(onLongPress).toHaveBeenCalledTimes(1)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('horizontal swipe on touch fires nothing', () => {
    const onLongPress = vi.fn()
    const onClick = vi.fn()
    const { result } = renderHook(() => useLongPress({ onLongPress, onClick }))

    act(() => result.current.onTouchStart(makeTouchEvent(10, 10)))
    // Move breaks the timer.
    act(() => result.current.onTouchMove(makeTouchEvent(80, 15)))
    act(() => vi.advanceTimersByTime(500))
    // End position 60+px away — treat as swipe, no click.
    act(() => result.current.onTouchEnd(makeTouchEvent(90, 15)))

    expect(onLongPress).not.toHaveBeenCalled()
    expect(onClick).not.toHaveBeenCalled()
  })

  it('disabled: fires nothing on any gesture', () => {
    const onLongPress = vi.fn()
    const onClick = vi.fn()
    const { result } = renderHook(() =>
      useLongPress({ onLongPress, onClick, disabled: true }),
    )

    act(() => result.current.onMouseDown(makeMouseEvent()))
    act(() => vi.advanceTimersByTime(500))
    act(() => result.current.onMouseUp(makeMouseEvent()))
    act(() => result.current.onContextMenu(makeMouseEvent(2)))

    expect(onLongPress).not.toHaveBeenCalled()
    expect(onClick).not.toHaveBeenCalled()
  })

  it('mouse events fired right after touchEnd do not double-trigger', () => {
    const onLongPress = vi.fn()
    const onClick = vi.fn()
    const { result } = renderHook(() => useLongPress({ onLongPress, onClick }))

    // Full touch tap.
    act(() => result.current.onTouchStart(makeTouchEvent(10, 10)))
    act(() => result.current.onTouchEnd(makeTouchEvent(10, 10)))
    expect(onClick).toHaveBeenCalledTimes(1)

    // Browser-synthesized mouse events right after — must be ignored
    // because `isTouching` sentinel is still active for ~400ms.
    act(() => result.current.onMouseDown(makeMouseEvent()))
    act(() => vi.advanceTimersByTime(100))
    act(() => result.current.onMouseUp(makeMouseEvent()))

    expect(onClick).toHaveBeenCalledTimes(1) // still just the touch tap
    expect(onLongPress).not.toHaveBeenCalled()
  })

  it('respects custom delayMs', () => {
    const onLongPress = vi.fn()
    const { result } = renderHook(() => useLongPress({ onLongPress, delayMs: 1000 }))

    act(() => result.current.onMouseDown(makeMouseEvent()))
    act(() => vi.advanceTimersByTime(500))
    expect(onLongPress).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(500))
    expect(onLongPress).toHaveBeenCalledTimes(1)
  })
})
