import React, { useMemo } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import WidgetCardFrame from "./WidgetCardFrame";
import { WIDGET_MAP } from "./widgets/registry";

function SortableTile({ id, size, title, onRemove, onSettings, onResize, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  // size → Bootstrap columns (md=6, lg=12 on lg screens)
  const colClass = size === "lg" ? "col-12" : "col-12 col-lg-6";

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`${colClass} tw-cursor-move`}>
      <WidgetCardFrame title={title} onRemove={onRemove} onSettings={onSettings} size={size} onResize={onResize}>
        {children}
      </WidgetCardFrame>
    </div>
  );
}

export default function DashboardWidgetsGrid({
  layout, setLayout, // [{key, size, settings}]
  onOpenSettings,     // (key) => void
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const ids = useMemo(() => layout.map(w => w.key), [layout]);

  const handleDragEnd = (e) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(active.id);
    const newIndex = ids.indexOf(over.id);
    setLayout(arrayMove(layout, oldIndex, newIndex));
  };

  const remove = (key) => setLayout(layout.filter(w => w.key !== key));
  const resize = (key, to) => setLayout(layout.map(w => w.key===key ? { ...w, size: to } : w));

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div className="row gy-4">
          {layout.map(({ key, size, settings }) => {
            const meta = WIDGET_MAP[key];
            if (!meta) return null;
            const Comp = meta.component;
            return (
              <SortableTile
                key={key} id={key} size={size} title={meta.title}
                onRemove={() => remove(key)}
                onSettings={() => onOpenSettings(key)}
                onResize={(to) => resize(key, to)}
              >
                <Comp settings={settings} />
              </SortableTile>
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
