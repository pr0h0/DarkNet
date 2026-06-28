import { useRef } from "react";
import type { WindowState } from "../store";
import { closeWindow, focusWindow, snapWindow, toggleMinimize, updateWindow } from "../game/engine";

export function Window({ win, children }: { win: WindowState; children: React.ReactNode }) {
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const resize = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

  function onResizeDown(e: React.PointerEvent) {
    e.stopPropagation();
    focusWindow(win.id);
    if (win.snap !== "none") updateWindow(win.id, { snap: "none" });
    resize.current = { x: e.clientX, y: e.clientY, w: win.w, h: win.h };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onResizeMove(e: React.PointerEvent) {
    if (!resize.current) return;
    const r = resize.current;
    updateWindow(win.id, {
      w: Math.max(320, r.w + (e.clientX - r.x)),
      h: Math.max(200, r.h + (e.clientY - r.y)),
    });
  }
  function onResizeUp(e: React.PointerEvent) {
    resize.current = null;
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* */ }
  }

  function onTitleDown(e: React.PointerEvent) {
    if ((e.target as HTMLElement).tagName === "BUTTON") return;
    focusWindow(win.id);
    if (win.snap !== "none") updateWindow(win.id, { snap: "none" });
    drag.current = { dx: e.clientX - win.x, dy: e.clientY - win.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onMove(e: React.PointerEvent) {
    if (!drag.current) return;
    updateWindow(win.id, {
      x: Math.max(0, e.clientX - drag.current.dx),
      y: Math.max(34, e.clientY - drag.current.dy),
    });
  }
  function onUp(e: React.PointerEvent) {
    drag.current = null;
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* */ }
  }

  if (win.minimized) return null;

  return (
    <div
      className="window"
      style={{ left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z }}
      onPointerDown={() => focusWindow(win.id)}
    >
      <div className="titlebar" onPointerDown={onTitleDown} onPointerMove={onMove} onPointerUp={onUp}
        onDoubleClick={() => snapWindow(win.id, win.snap === "max" ? "none" : "max")}>
        <span className="title">{win.title}</span>
        <div className="winbtns">
          <button title="top-left quarter" onClick={() => snapWindow(win.id, "tl")}>◰</button>
          <button title="top-right quarter" onClick={() => snapWindow(win.id, "tr")}>◳</button>
          <button title="bottom-left quarter" onClick={() => snapWindow(win.id, "bl")}>◱</button>
          <button title="bottom-right quarter" onClick={() => snapWindow(win.id, "br")}>◲</button>
          <span className="winsep" />
          <button title="snap left half" onClick={() => snapWindow(win.id, "left")}>◧</button>
          <button title="snap right half" onClick={() => snapWindow(win.id, "right")}>◨</button>
          <button title="maximize" onClick={() => snapWindow(win.id, win.snap === "max" ? "none" : "max")}>▢</button>
          <button title="minimize" onClick={() => toggleMinimize(win.id)}>—</button>
          <button title="close" className="x" onClick={() => closeWindow(win.id)}>×</button>
        </div>
      </div>
      <div className="window-body">{children}</div>
      <div className="resize-grip" title="drag to resize"
        onPointerDown={onResizeDown} onPointerMove={onResizeMove} onPointerUp={onResizeUp} />
    </div>
  );
}
