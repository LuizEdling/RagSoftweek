import { useState, type ReactNode } from 'react';
import { GripVertical, ChevronUp, ChevronDown } from 'lucide-react';

interface DragListProps<T> {
  items: T[];
  onReorder: (next: T[]) => void;
  getKey: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => ReactNode;
  disabled?: boolean;
  /** Cor de fundo por item, opcional (usada para feedback de acerto/erro). */
  itemClassName?: (item: T, index: number) => string;
}

/** Lista reordenável por arrastar-e-soltar (mouse/desktop, via HTML5 DnD),
 * com botões de mover para cima/baixo como alternativa acessível e para
 * telas de toque, onde o drag nativo não funciona bem. */
export default function DragList<T>({
  items,
  onReorder,
  getKey,
  renderItem,
  disabled = false,
  itemClassName,
}: DragListProps<T>) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  function move(from: number, to: number) {
    if (from === to || to < 0 || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onReorder(next);
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, index) => (
        <div
          key={getKey(item, index)}
          draggable={!disabled}
          onDragStart={() => setDragIndex(index)}
          onDragEnter={() => setOverIndex(index)}
          onDragOver={(e) => e.preventDefault()}
          onDragEnd={() => {
            setDragIndex(null);
            setOverIndex(null);
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (dragIndex !== null) move(dragIndex, index);
            setDragIndex(null);
            setOverIndex(null);
          }}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 transition-colors ${
            overIndex === index && dragIndex !== null
              ? 'border-blue-primary/60 bg-blue-primary/10'
              : 'border-white/10 bg-navy-800/60'
          } ${itemClassName ? itemClassName(item, index) : ''} ${
            disabled ? '' : 'cursor-grab active:cursor-grabbing'
          }`}
        >
          {!disabled && <GripVertical className="h-4 w-4 shrink-0 text-slate-600" />}
          <div className="min-w-0 flex-1">{renderItem(item, index)}</div>
          {!disabled && (
            <div className="flex shrink-0 flex-col">
              <button
                type="button"
                aria-label="Mover para cima"
                onClick={() => move(index, index - 1)}
                disabled={index === 0}
                className="rounded p-0.5 text-slate-500 hover:text-white disabled:opacity-20"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Mover para baixo"
                onClick={() => move(index, index + 1)}
                disabled={index === items.length - 1}
                className="rounded p-0.5 text-slate-500 hover:text-white disabled:opacity-20"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
