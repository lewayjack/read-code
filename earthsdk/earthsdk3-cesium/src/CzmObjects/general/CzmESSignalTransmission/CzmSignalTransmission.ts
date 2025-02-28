import { PickedInfo } from "earthsdk3";
import { PositionsEditing } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { Destroyable, Listener, Event, reactArray, reactPositions, extendClassProps, ReactivePropsToNativePropsAndChanged, createNextAnimateFrameEvent, bind, track, SceneObjectKey } from "xbsj-base";
import { CzmSignalTransmissionCollection } from "./CzmSignalTransmissionCollection";

export class CzmSignalTransmission extends Destroyable {
    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    private _sPositionsEditing;
    get sPositionsEditing() { return this._sPositionsEditing; }

    private _collection;
    get collection() { return this._collection; }

    get player() { return this.collection.player; }

    get ratio() { return this.player.ratio; }
    set ratio(value: number) { this.player.ratio = value; }
    get ratioChanged() { return this.player.ratioChanged; }

    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        this._sPositionsEditing = this.disposeVar(new PositionsEditing([this, 'positions'], false, [this, 'editing'], czmViewer));
        this._collection = this.disposeVar(new CzmSignalTransmissionCollection(czmViewer, id));
        this.dispose(track([this._collection, 'show'], [this, 'show']));
        this.dispose(track([this._collection, 'startTime'], [this, 'startTime']));
        this.dispose(track([this._collection, 'transmissionTime'], [this, 'transmissionTime']));
        this.dispose(track([this._collection, 'color'], [this, 'color']));
        this.dispose(track([this._collection, 'bgColor'], [this, 'bgColor']));
        this.dispose(track([this._collection, 'width'], [this, 'width']));
        this.dispose(track([this._collection, 'arcType'], [this, 'arcType']));
        this.dispose(track([this._collection, 'brightening'], [this, 'brightening']));
        this.dispose(track([this._collection, 'depthTest'], [this, 'depthTest']));
        this.dispose(track([this._collection, 'imageUrl'], [this, 'imageUrl']));
        this.dispose(track([this._collection, 'repeat'], [this, 'repeat']));
        this.dispose(track([this._collection, 'repeatLength'], [this, 'repeatLength']));
        this.dispose(track([this._collection, 'bidirectional'], [this, 'bidirectional']));
        this.dispose(track([this._collection, 'allowPicking'], [this, 'allowPicking']));

        this.dispose(bind([this._collection, 'playing'], [this, 'playing']));
        this.dispose(track([this._collection, 'loop'], [this, 'loop']));
        this.dispose(bind([this._collection, 'currentTime'], [this, 'currentTime']));
        this.dispose(bind([this._collection, 'duration'], [this, 'duration']));
        this.dispose(bind([this._collection, 'speed'], [this, 'speed']));

        this.dispose(this.flyToEvent.disposableOn(duration => {
            this._collection.flyTo(duration);
        }));

        {
            const update = () => {
                // if (!this.positions) {
                //     this._collection.positionsSet = undefined;
                //     return;
                // }
                // this._collection.positionsSet = [this.positions.map(e => [...e])];
                if (!this.positions) {
                    this._collection.data = undefined;
                    return;
                }

                if (this.heightRatio === 0) {
                    this._collection.data = [{
                        positions: this.positions,
                        width: this.width,
                    }];
                    return;
                }

                if (this.positions.length >= 2) {
                    this._collection.data = [{
                        startPos: this.positions[0],
                        endPos: this.positions[this.positions.length - 1],
                        width: this.width,
                        heightRatio: this.heightRatio,
                    }];
                    return;
                }

                this._collection.data = undefined;
            };
            update();
            // this.dispose(this.positionsChanged.disposableOn(update));
            const event = this.disposeVar(createNextAnimateFrameEvent(this.positionsChanged, this.heightRatioChanged, this.widthChanged));
            this.dispose(event.disposableOn(update));
        }
    }

    static defaults = {
        loop: true,
        currentTime: 0,
        playerCurrentTime: 0,
        duration: 3000,
        speed: 1,
        playing: true,
        transmissionTime: 3000,
    }
    static defaultImageUri = '${earthsdk3-assets-script-dir}/assets/img/signal.png';
}

export namespace CzmSignalTransmission {
    export const createDefaultProps = () => ({
        show: true,
        imageUrl: undefined as string | undefined,
        repeat: 1,
        bidirectional: 0 as 0 | 1 | 2 | 3,
        startTime: 0,
        transmissionTime: undefined as number | undefined,
        color: reactArray<[number, number, number, number]>([0, 1, 0, 1]),
        bgColor: reactArray<[number, number, number, number]>([0, 1, 0, 0.2]),
        width: 3,
        repeatLength: 10000,
        arcType: 'GEODESIC' as 'NONE' | 'GEODESIC' | 'RHUMB',
        brightening: false,
        depthTest: true,
        positions: reactPositions(undefined),
        heightRatio: 0,
        allowPicking: false,
        editing: false,

        loop: undefined as boolean | undefined,
        currentTime: undefined as number | undefined,
        duration: undefined as number | undefined,
        speed: undefined as number | undefined,
        playing: undefined as boolean | undefined,
    });
}
extendClassProps(CzmSignalTransmission.prototype, CzmSignalTransmission.createDefaultProps);
export interface CzmSignalTransmission extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmSignalTransmission.createDefaultProps>> { }
