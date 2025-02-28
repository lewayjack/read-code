import { Destroyable, react, TreeItem } from "xbsj-base";

export type DragStartData = {
    type: 'UITreeA';
    value: TreeItem;
} | {
    type: 'Other',
    value: any[],
}

export class DragStartDataManager extends Destroyable {
    private _data = this.dv(react<DragStartData | undefined>(undefined));
    constructor() {
        super();
    }

    set data(value: DragStartData | undefined) {
        this._data.value = value;
    }

    get data() {
        return this._data.value;
    }

    get dataChanged() {
        return this._data.changed;
    }
}
