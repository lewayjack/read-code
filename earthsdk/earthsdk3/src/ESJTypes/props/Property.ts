import { Destroyable } from "xbsj-base";
export abstract class Property extends Destroyable {
    static _accumId = -1;
    private _id = ++Property._accumId;
    constructor(private _name: string, private _description: string) {
        super();
    }

    get id() { return this._id; }
    get name() { return this._name; }
    get description() { return this._description; }
    abstract get type(): string;
}

