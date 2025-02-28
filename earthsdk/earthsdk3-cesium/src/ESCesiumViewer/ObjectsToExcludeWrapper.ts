import { Destroyable } from "xbsj-base";
import { ESCesiumViewer } from ".";

export class ObjectsToExcludeWrapper extends Destroyable {
    constructor(private _viewer: ESCesiumViewer, primitives: object[] | object) {
        super();

        const pm = this._viewer.extensions?.pickingManager;
        if (!pm) return;

        const { objectsToExclude } = pm;

        const ps = Array.isArray(primitives) ? [...primitives] : [primitives];

        for (const p of ps) {
            if (objectsToExclude.includes(p)) {
                throw new Error(`objectsToExclude.includes(p)`);
            }
            objectsToExclude.push(p);
        }

        this.dispose(() => {
            for (let p of ps) {
                const index = objectsToExclude.indexOf(p);
                if (index === -1) {
                    throw new Error(`-1 === objectsToExclude.indexOf(p)`);
                }
                objectsToExclude.splice(index, 1);
            }
        });
    }
}
