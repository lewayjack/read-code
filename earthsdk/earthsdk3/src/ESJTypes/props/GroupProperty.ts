import { Property } from "./Property";

export class GroupProperty extends Property {
    constructor(name: string, description: string, private _children: Property[]) {
        super(name, description);
    }
    override get type() { return 'GroupProperty'; }
    get children() { return this._children; }
}
