import { Destroyable, Event } from "xbsj-base";
import { EditingProcessing } from ".";
import { AddingEditingProcessing } from "./AddingEditingProcessing";
import { GeoPolylineEditorImpl } from "..";

export function deletePreviousPoint(editing: EditingProcessing, currentIndex: number) {
    const { impl } = editing;
    const posEditors = impl.positionEditors;
    const previousIndex = currentIndex - 1;
    if (previousIndex < 0) {
        console.warn(`previousIndex < 0, cannot delete the point!`);
        return false;
    }
    posEditors.splice(previousIndex, 1);
    return true;
}

export class PreviousPointDeleting extends Destroyable {
    private _overEvent = this.disposeVar(new Event<[boolean]>());
    get overEvent() { return this._overEvent; }

    private _doEvent = this.disposeVar(new Event());
    do() { return this._doEvent.emit(); }

    constructor(private _adding: AddingEditingProcessing, currentIndex: number) {
        super();

        const { impl } = this._adding.editing;

        this.dispose(this._doEvent.disposableOn(() => {
            if (deletePreviousPoint(this._adding.editing, currentIndex)) {
                this._overEvent.emit(true);
            } else {
                // this._overEvent.emit(false);
            }
        }));

        (impl.debug ?? GeoPolylineEditorImpl.defaults.debug) && console.log(`PreviousPointDeleting creating! currentIndex(${currentIndex})`);
        this.dispose(() => {
            (impl.debug ?? GeoPolylineEditorImpl.defaults.debug) && console.log(`PreviousPointDeleting destroying! currentIndex(${currentIndex})`);
        });
    }
}
