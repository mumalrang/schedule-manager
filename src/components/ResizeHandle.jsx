import React, { useState, useRef, useCallback, memo } from 'react'

/**
 * 드래그로 너비를 조절하는 세로 구분선 컴포넌트
 * onResize(deltaX) 를 호출해 부모에서 너비를 직접 계산하도록 위임
 */
const ResizeHandle = memo(({ onResize }) => {
  const [hovered, setHovered] = useState(false)
  const startX = useRef(null)

  const onMouseDown = useCallback((e) => {
    e.preventDefault()
    startX.current = e.clientX
    document.body.style.cursor    = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMouseMove = (e) => {
      const delta = e.clientX - startX.current
      startX.current = e.clientX
      onResize(delta)
    }
    const onMouseUp = () => {
      document.body.style.cursor    = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup',   onMouseUp)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup',   onMouseUp)
  }, [onResize])

  return (
    <div
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex-shrink-0 cursor-col-resize relative"
      style={{ width: 8, zIndex: 10 }}
    >
      <div
        className="absolute inset-y-0"
        style={{
          left: '50%',
          width: 1,
          background: hovered ? '#444' : '#1e1e1e',
          transition: 'background 0.15s',
        }}
      />
    </div>
  )
})

export default ResizeHandle
