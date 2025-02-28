import { Destroyable, Event, track } from "xbsj-base";
import { PolylinePositionEditor } from "../PolylinePositionEditor";
import { AddingEditingProcessing } from "./AddingEditingProcessing";
import { GeoPolylineEditorImpl } from "..";


export class PointAdding extends Destroyable {
    get adding() { return this._adding; }

    private _overEvent = this.disposeVar(new Event<[boolean]>());
    get overEvent() { return this._overEvent; }

    constructor(private _adding: AddingEditingProcessing, index: number) {
        super();

        const { impl, geoCoordinatesPicker } = this.adding.editing;

        let currentPosEditor = new PolylinePositionEditor(impl, undefined);
        impl.positionEditors.splice(index, 0, currentPosEditor);
        const remove = () => {
            (impl.debug ?? GeoPolylineEditorImpl.defaults.debug) && console.log(`delete currentPosEditor`);
            const n = impl.positionEditors.indexOf(currentPosEditor);
            if (n === -1) {
                throw new Error(`currentPosEditor not found`);
            }
            impl.positionEditors.splice(n, 1);
        };

        if (geoCoordinatesPicker.enabled ?? false) {
            console.error(`geoCoordinatesPicker.enabled is true!`);
            throw new Error(`geoCoordinatesPicker.enabled is true!`);
        }
        this.dispose(track([currentPosEditor, 'position'], [geoCoordinatesPicker, 'position']));

        geoCoordinatesPicker.enabled = true;

        let finished = false;
        this.dispose(geoCoordinatesPicker.overEvent.disposableOnce(() => {
            finished = true;
            if (currentPosEditor.position === undefined) {
                remove();
                this._overEvent.emit(false);
            } else {
                this._overEvent.emit(true);
            }
        }));

        this.dispose(() => {
            if (!finished) {
                remove();
                this._overEvent.emit(false);
            }
        });

        this.dispose(() => {
            geoCoordinatesPicker.enabled = false;
        });

        (impl.debug ?? GeoPolylineEditorImpl.defaults.debug) && console.log(`PointAdding creating! index(${index})`);
        this.dispose(() => {
            (impl.debug ?? GeoPolylineEditorImpl.defaults.debug) && console.log(`PointAdding destroying! index(${index})`);
        });
    }
}
