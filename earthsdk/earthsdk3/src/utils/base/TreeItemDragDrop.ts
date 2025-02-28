import { Destroyable, Event } from "xbsj-base";

export class TreeItemDragDrop extends Destroyable {
    protected _dragStartEvent = this.dv(new Event<[DragEvent]>());
    protected _dragOverEvent = this.dv(new Event<[DragEvent]>());
    protected _dragLeaveEvent = this.dv(new Event<[DragEvent]>());
    protected _dropEvent = this.dv(new Event<[DragEvent]>());

    dragStart(dragEvent: DragEvent) {
        this._dragStartEvent.emit(dragEvent);
    }

    dragOver(dragEvent: DragEvent) {
        this._dragOverEvent.emit(dragEvent);
    }

    dragLeave(dragEvent: DragEvent) {
        this._dragLeaveEvent.emit(dragEvent);
    }

    drop(dragEvent: DragEvent) {
        this._dropEvent.emit(dragEvent);
    }
}
