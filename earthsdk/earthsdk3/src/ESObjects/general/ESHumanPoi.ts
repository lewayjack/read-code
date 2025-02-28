import { EnumProperty, ESJVector2D, NumberProperty } from "../../ESJTypes";
import { bind, createNextAnimateFrameEvent, extendClassProps, reactArray, reactJson, track, UniteChanged } from "xbsj-base";
import { ESHuman } from "./ESHuman";
import { ESPoi2D } from "./ESPoi2D";
import { ESSceneObject } from "../base";
/**
 * https://www.wolai.com/earthsdk/3BJMp3dWPNFrGjcTC7junh
 */
export class ESHumanPoi extends ESHuman {
    static override readonly type = this.register('ESHumanPoi', this, { chsName: '人员poi', tags: ['ESObjects'], description: "ESHuman + ESPoi2D组合对象" });
    override get typeName() { return 'ESHumanPoi'; }
    override get defaultProps() { return ESHumanPoi.createDefaultProps(); }
    private _human = this.dv(new ESHuman(this.id));
    get human() { return this._human; }
    private _poi = this.dv(new ESPoi2D(this.id));
    get poi() { return this._poi; }

    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            basic: [
                ...properties.basic,
                new EnumProperty('poi模式', 'poiMode', false, false, [this, 'poiMode'], ESPoi2D.defaults.modes, 'SquareH01'),
                new NumberProperty('poi高度偏移', 'poi高度偏移', false, false, [this, 'poiOffsetHeight'], 1.8),
            ],
        }
    }
    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new EnumProperty('poi模式', 'poiMode', false, false, [this, 'poiMode'], ESPoi2D.defaults.modes),
            new NumberProperty('poi高度偏移', 'poi高度偏移', false, false, [this, 'poiOffsetHeight'], 1.8),
        ];
    }
    constructor(id?: string) {
        super(id);
        {
            this.d(this.components.disposableAdd(this._human));
            this.d(this.components.disposableAdd(this._poi));
        }

        {
            const { _human, _poi } = this;
            this.d(track([_human, 'show'], [this, 'show']));
            this.d(track([_poi, 'show'], [this, 'show']));

            this.d(track([_human, 'allowPicking'], [this, 'allowPicking']));
            this.d(track([_poi, 'allowPicking'], [this, 'allowPicking']));

            this.d(track([_human, 'scale'], [this, 'scale']));
            this.d(track([_poi, 'scale'], [this, 'scale']));

            this.d(track([_human, 'collision'], [this, 'collision']));
            this.d(track([_poi, 'collision'], [this, 'collision']));

            this.d(bind([_human, 'editing'], [this, 'editing']));
            this.d(bind([_human, 'flyInParam'], [this, 'flyInParam']));
            this.d(bind([_human, 'flyToParam'], [this, 'flyToParam']));
            this.d(track([_human, 'animation'], [this, 'animation']));
            this.d(track([_human, 'mode'], [this, 'mode']));
            this.d(track([_human, 'minVisibleDistance'], [this, 'minVisibleDistance']));
            this.d(track([_human, 'maxVisibleDistance'], [this, 'maxVisibleDistance']));

            this.d(track([_poi, 'name'], [this, 'name']));
            this.d(track([_poi, 'mode'], [this, 'poiMode']));
            this.d(track([_poi, 'autoAnchor'], [this, 'autoAnchor']));
            this.d(track([_poi, 'screenRender'], [this, 'screenRender']));
            this.d(track([_poi, 'size'], [this, 'size']));
            this.d(track([_poi, 'anchor'], [this, 'anchor']));
            this.d(track([_poi, 'sizeByContent'], [this, 'sizeByContent']));
            this.d(track([_poi, 'renderMode'], [this, 'renderMode']));
            this.d(track([_poi, 'rotationType'], [this, 'rotationType']));
            this.d(track([_poi, 'zOrder'], [this, 'zOrder']));
            this.d(track([_poi, 'minVisibleDistance'], [this, 'minVisibleDistance']));
            this.d(track([_poi, 'maxVisibleDistance'], [this, 'maxVisibleDistance']));

            //移动至实现类中，czm根据human的position改变poi的position,ue根据actorTag绑定human的position;
            // this.d(bind([_human, 'position'], [this, 'position']));
            // this.d(bind([_human, 'rotation'], [this, 'rotation']));
            // const updatePos = () => {
            //     const pos = this.position;
            //     _poi.position = [pos[0], pos[1], pos[2] + this.poiOffsetHeight];
            // }
            // updatePos();
            // const posEvent = this.dv(createNextAnimateFrameEvent(this.positionChanged, this.poiOffsetHeightChanged))
            // this.d(posEvent.don(updatePos));

            this.d(this.flyInEvent.don((duration?: number) => { _human.flyIn(duration); }));
            this.d(this.flyToEvent.don((duration?: number) => { _human.flyTo(duration); }));
            this.d(this.calcFlyToParamEvent.don(() => { _human.calcFlyToParam(); }));
            this.d(this.calcFlyInParamEvent.don(() => { _human.calcFlyInParam(); }));

            this.d(this.smoothMoveEvent.don((Destination, Time) => {
                _human.smoothMove(Destination, Time);
            }));

            this.d(this.smoothMoveWithRotationEvent.don((Destination, Rotation, Time) => {
                _human.smoothMoveWithRotation(Destination, Rotation, Time);
            }));

            this.d(this.smoothMoveOnGroundEvent.don((Lon, Lat, Time, Ground) => {
                _human.smoothMoveOnGround(Lon, Lat, Time, Ground);
            }));

            this.d(this.smoothMoveWithRotationOnGroundEvent.don((Rotation, Lon, Lat, Time, Ground) => {
                _human.smoothMoveWithRotationOnGround(Rotation, Lon, Lat, Time, Ground);
            }));

            this.d(this.automaticLandingEvent.don(() => {
                _human.automaticLanding();
            }));
        }
    }
}



export namespace ESHumanPoi {
    export const createDefaultProps = () => ({
        poiOffsetHeight: 1.8,
        poiMode: 'SquareH01',
        style: reactJson<{ [xx: string]: any }>({}),
        autoAnchor: true,
        screenRender: true,
        size: reactArray<ESJVector2D>([100, 100]),
        anchor: reactArray<ESJVector2D>([0.5, 1]),
        sizeByContent: true,
        renderMode: 0,
        rotationType: 1,
        zOrder: 0,
        ...ESHuman.createDefaultProps(),
    });
}
extendClassProps(ESHumanPoi.prototype, ESHumanPoi.createDefaultProps);
export interface ESHumanPoi extends UniteChanged<ReturnType<typeof ESHumanPoi.createDefaultProps>> { }


