import { bind, extendClassProps, track, UniteChanged } from "xbsj-base";
import { ESExcavate } from "./ESExcavate";
import { ESPit } from "./ESPit";
import { ESSceneObject } from "../base";

/**
 * https://www.wolai.com/earthsdk/ixfCjq4UjUqWy7SeVHnCnt
 */
export class ESHole extends ESPit {
    static override readonly type = this.register('ESHole', this, { chsName: '挖坑(带材质+深度)', tags: ['ESObjects'], description: '挖坑' });
    override get typeName() { return 'ESHole'; }
    override get defaultProps() { return ESHole.createDefaultProps(); }
    private _excavate = this.dv(new ESExcavate(this.id));
    get excavate() { return this._excavate; }
    private _pit = this.dv(new ESPit(this.id));

    constructor(id?: string) {
        super(id);
        {
            this.d(this.components.disposableAdd(this._excavate));
            this.d(this.components.disposableAdd(this._pit));
        }
        {
            const { _excavate, _pit } = this;
            this.d(track([_excavate, 'show'], [this, 'show']));
            this.d(track([_pit, 'show'], [this, 'show']));

            this.d(track([_excavate, 'allowPicking'], [this, 'allowPicking']));
            this.d(track([_pit, 'allowPicking'], [this, 'allowPicking']));

            this.d(track([_excavate, 'collision'], [this, 'collision']));
            this.d(track([_pit, 'collision'], [this, 'collision']));

            this.d(bind([_pit, 'editing'], [this, 'editing']));
            this.d(bind([_pit, 'points'], [this, 'points']));
            this.d(track([_excavate, 'points'], [this, 'points']));

            this.d(track([_pit, 'pointed'], [this, 'pointed']));
            this.d(track([_excavate, 'pointed'], [this, 'pointed']));

            this.d(track([_pit, 'pointStyle'], [this, 'pointStyle']));
            this.d(track([_excavate, 'pointStyle'], [this, 'pointStyle']));

            this.d(track([_pit, 'stroked'], [this, 'stroked']));
            this.d(track([_excavate, 'stroked'], [this, 'stroked']));

            this.d(track([_pit, 'strokeStyle'], [this, 'strokeStyle']));
            this.d(track([_excavate, 'strokeStyle'], [this, 'strokeStyle']));

            this.d(track([_pit, 'filled'], [this, 'filled']));
            // this.d(track([_excavate, 'filled'], [this, 'filled']));

            this.d(track([_pit, 'fillStyle'], [this, 'fillStyle']));
            this.d(track([_excavate, 'fillStyle'], [this, 'fillStyle']));

            this.d(track([_excavate, 'mode'], [this, 'mode']));
            this.d(track([_excavate, 'targetID'], [this, 'targetID']));

            this.d(track([_pit, 'depth'], [this, 'depth']));
            this.d(track([_pit, 'sideImage'], [this, 'sideImage']));
            this.d(track([_pit, 'bottomImage'], [this, 'bottomImage']));
            this.d(track([_pit, 'opacity'], [this, 'opacity']));
            this.d(track([_pit, 'interpolation'], [this, 'interpolation']));

            this.d(bind([_pit, 'flyInParam'], [this, 'flyInParam']));
            this.d(bind([_pit, 'flyToParam'], [this, 'flyToParam']));

            this.d(this.flyInEvent.don((duration?: number) => { _pit.flyIn(duration); }));
            this.d(this.flyToEvent.don((duration?: number) => { _pit.flyTo(duration); }));
            this.d(this.calcFlyToParamEvent.don(() => { _pit.calcFlyToParam(); }));
            this.d(this.calcFlyInParamEvent.don(() => { _pit.calcFlyInParam(); }));
        }
    }
}

export namespace ESHole {
    export const createDefaultProps = () => ({
        mode: "in",
        targetID: "",
        ...ESPit.createDefaultProps(),
    });
}
extendClassProps(ESHole.prototype, ESHole.createDefaultProps);
export interface ESHole extends UniteChanged<ReturnType<typeof ESHole.createDefaultProps>> { }


