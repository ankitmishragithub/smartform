import React, { useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import DeleteIcon from '@mui/icons-material/Delete';
import { CANVAS_FIELD } from "./constants";
import renderCanvasInput from "./renderCanvasInput";


export default function FieldCard({
  field,
  idx,
  parentId,
  row,
  col,
  onSelect,
  onDelete,
  onMove,
}) {
  const ref = useRef(null);
  const [{ isDragging }, drag] = useDrag({
    type: CANVAS_FIELD,
    item: { id: field.id, index: idx, parentId, row, col },
    collect: (m) => ({ isDragging: m.isDragging() }),
  });
  const [, drop] = useDrop({
    accept: CANVAS_FIELD,
    hover(item, monitor) {
      if (!monitor.isOver({ shallow: true }) || !ref.current) return;
      const dragIdx = item.index,
        hoverIdx = idx;
      if (dragIdx === hoverIdx) return;
      const { top, bottom } = ref.current.getBoundingClientRect();
      const hoverMid = (bottom - top) / 2;
      const clientY = monitor.getClientOffset().y - top;
      if (
        (dragIdx < hoverIdx && clientY < hoverMid) ||
        (dragIdx > hoverIdx && clientY > hoverMid)
      ) {
        return;
      }
      onMove(dragIdx, hoverIdx, item.parentId, item.row, item.col);
      item.index = hoverIdx;
    },
  });
  drag(drop(ref));

  return (
    <div
      ref={ref}
      className="canvas-field"
      style={{ opacity: isDragging ? 0.5 : 1 }}
      onClick={() => onSelect(field.id)}
    >
      <button
        className="delete-btn"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(field.id);
        }}
      >
        <DeleteIcon fontSize="medium"/>
      </button>
      <label>{field.label}</label>
      {/* <div className="canvas-input">{renderCanvasInput(field)}</div> */}
    </div>
  );
}
