import { Destroyable, Listener, Event, react, bind, reactJsonWithUndefined, reactArrayCollectionWithUndefined, reactArrayWithUndefined, extendClassProps, ReactivePropsToNativePropsAndChanged, createNextAnimateFrameEvent, SceneObjectKey } from "xbsj-base";
import { PositionEditing } from "../../Editing";
import { ESCesiumViewer } from "../../../../ESCesiumViewer";
import { Player, ESSceneObject, ESJParticleEmitterJsonType } from "earthsdk3";
import * as Cesium from 'cesium';
import { flyTo, toCartesian2, toColor } from "../../../../utils";
import { createParticleSystemEmitterFromJson } from "./particleSystemPrimitiveUtils";
import { fixParticleSystem } from "./fixParticleSystem";

fixParticleSystem();

export class CzmParticleSystemPrimitive extends Destroyable {
    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    private _player;
    get player() { return this._player; }

    private _updateCallbackFunc = this.disposeVar(react<Function | undefined>(undefined));
    get updateCallbackFunc() { return this._updateCallbackFunc.value; }
    set updateCallbackFunc(value: Function | undefined) { this._updateCallbackFunc.value = value; }
    get updateCallbackFuncChanged() { return this._updateCallbackFunc.changed; }

    private _disposeUpdateCallbackFunc = (() => {
        this.dispose(this.updateCallbackFuncChanged.don((e) => {
            e ? (this.updateCallback = e.toString()) : this.updateCallback = undefined;
        }))
    })()

    private _disposeUpdateCallback = (() => {
        this.dispose(this.updateCallbackChanged.don((e) => {
            e ? (this.updateCallbackFunc = Function('"use strict";return (' + e + ')')()) : this.updateCallbackFunc = undefined;
        }))
    })()


    get ratio() { return this._player.ratio; }
    set ratio(value: number) { this._player.ratio = value; }
    get ratioChanged() { return this._player.ratioChanged; }

    private _sPositionEditing;
    get sPositionEditing() { return this._sPositionEditing; }

    private _primitive?: Cesium.ParticleSystem;
    get primitive() { return this._primitive; }

    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        this._player = this.disposeVar(new Player());
        this._sPositionEditing = this.disposeVar(new PositionEditing([this, 'position'], [this, 'positionEditing'], czmViewer));
        const viewer = czmViewer.viewer;
        if (!viewer) return;
        {
            const d = CzmParticleSystemPrimitive.defaults;
            this.dispose(bind([this._player, 'loop'], [this, 'playingLoop'], b => b ?? d.playingLoop, a => a ?? d.playingLoop));
            this.dispose(bind([this._player, 'currentTime'], [this, 'currentTime'], b => b ?? d.currentTime, a => a ?? d.currentTime));
            this.dispose(bind([this._player, 'duration'], [this, 'duration'], b => b ?? d.duration, a => a ?? d.duration));
            this.dispose(bind([this._player, 'playing'], [this, 'playing'], b => b ?? d.playing, a => a ?? d.playing));
            this.dispose(bind([this._player, 'speed'], [this, 'playingSpeed'], b => b ?? d.playingSpeed, a => a ?? d.playingSpeed));
        }
        {
            const removePrimitive = () => {
                this._primitive && viewer.scene.primitives.remove(this._primitive);
                this._primitive = undefined;
            }
            this.dispose(removePrimitive);

            const getModelMatrix = () => {
                const p = this.position ?? [0, 0, 0]
                const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(p[0], p[1], p[2]));
                return modelMatrix
            }

            const computeEmitterModelMatrix = () => {
                const particleRotation = this.rotation ?? [0, 0, 0]
                const particleTranslation = this.translation ?? [0, 0, 0]
                const hpr = Cesium.HeadingPitchRoll.fromDegrees(particleRotation[0], particleRotation[1], particleRotation[2], new Cesium.HeadingPitchRoll());
                let trs = new Cesium.TranslationRotationScale();
                trs.translation = Cesium.Cartesian3.fromElements(particleTranslation[0], particleTranslation[1], particleTranslation[2], new Cesium.Cartesian3());
                trs.rotation = Cesium.Quaternion.fromHeadingPitchRoll(hpr, new Cesium.Quaternion());
                return Cesium.Matrix4.fromTranslationRotationScale(trs, new Cesium.Matrix4());
            }

            const getBursts = () => {
                if (!this.bursts) {
                    return undefined
                }
                let bursts: Cesium.ParticleBurst[] = []
                this.bursts.forEach(el => {
                    const elm = new Cesium.ParticleBurst({
                        time: el[0],
                        minimum: el[1],
                        maximum: el[2],
                    })
                    bursts.push(elm)
                })

                return bursts
            }

            const createPrimitive = () => {
                const modelMatrix = getModelMatrix()
                const emitterModelMatrix = computeEmitterModelMatrix()
                const bursts = getBursts()
                const emitter = createParticleSystemEmitterFromJson(this.emitter ?? CzmParticleSystemPrimitive.defaults.emitter)

                const primitive = new Cesium.ParticleSystem({
                    emitter: emitter,
                    bursts: bursts,
                    modelMatrix: modelMatrix,
                    emitterModelMatrix: emitterModelMatrix,
                    updateCallback: this.updateCallbackFunc ? (particle, dt) => {
                        this.updateCallbackFunc && this.updateCallbackFunc(particle, dt);
                    } : undefined,
                    image: ESSceneObject.context.getStrFromEnv(this.image && this.image.length != 0 ? this.image : CzmParticleSystemPrimitive.defaults.image),
                    imageSize: toCartesian2(this.imageSize ?? CzmParticleSystemPrimitive.defaults.imageSize),
                    minimumImageSize: this.minimumImageSize && toCartesian2(this.minimumImageSize),
                    maximumImageSize: this.maximumImageSize && toCartesian2(this.maximumImageSize),
                    show: this.show,
                    emissionRate: this.emissionRate,
                    loop: this.loop,
                    scale: this.scale,
                    startScale: this.startScale,
                    endScale: this.endScale ?? CzmParticleSystemPrimitive.defaults.endScale,
                    color: this.color && toColor(this.color),
                    startColor: this.startColor && toColor(this.startColor),
                    endColor: this.endColor && toColor(this.endColor),
                    sizeInMeters: this.sizeInMeters,
                    speed: this.speed,
                    minimumSpeed: this.minimumSpeed,
                    maximumSpeed: this.maximumSpeed,
                    lifetime: this.lifetime,
                    particleLife: this.particleLife ?? CzmParticleSystemPrimitive.defaults.particleLife,
                    minimumParticleLife: this.minimumParticleLife,
                    maximumParticleLife: this.maximumParticleLife,
                    mass: this.mass,
                    minimumMass: this.minimumMass,
                    maximumMass: this.maximumMass,
                })
                //@ts-ignore
                Cesium.ParticleSystem.prototype && (primitive.ESSceneObjectID = id)
                return primitive;
            }

            const recreatePrimitive = () => {
                removePrimitive()
                this._primitive = createPrimitive();
                this._primitive && viewer.scene.primitives.add(this._primitive);
            }

            const updatePrimitive = () => {
                if (!this._primitive) {
                    return;
                }
                const show = this.show ?? true;
                this._primitive.show = show;
                this.image && (this._primitive.image = ESSceneObject.context.getStrFromEnv(this.image && this.image.length != 0 ? this.image : CzmParticleSystemPrimitive.defaults.image));
            };
            recreatePrimitive();
            updatePrimitive();
            const recreateEvent = this.disposeVar(createNextAnimateFrameEvent(
                // sceneObject.updateCallbackChanged,
                this.emitterChanged,
                this.burstsChanged,
                this.emissionRateChanged,
                this.loopChanged,
                this.scaleChanged,
                this.startScaleChanged,
                this.endScaleChanged,
                this.colorChanged,
                this.startColorChanged,
                this.endColorChanged,
                this.imageSizeChanged,
                this.minimumImageSizeChanged,
                this.maximumImageSizeChanged,
                this.sizeInMetersChanged,
                this.speedChanged,
                this.minimumSpeedChanged,
                this.maximumSpeedChanged,
                this.lifetimeChanged,
                this.particleLifeChanged,
                this.minimumParticleLifeChanged,
                this.maximumParticleLifeChanged,
                this.massChanged,
                this.minimumMassChanged,
                this.maximumMassChanged,
                this.updateCallbackFuncChanged,
                // sceneObject.positionEditingChanged,
            ));

            this.dispose(recreateEvent.disposableOn(() => {
                recreatePrimitive();
                updatePrimitive();
            }));

            const updateEvent = this.disposeVar(createNextAnimateFrameEvent(
                this.showChanged,
                this.imageChanged,
            ));
            this.dispose(updateEvent.disposableOn(() => {
                updatePrimitive();
            }));

            const setPosition = () => {
                if (!this._primitive) {
                    return;
                }
                const modelMatrix = getModelMatrix();
                const emitterModelMatrix = computeEmitterModelMatrix();
                this._primitive.modelMatrix = modelMatrix;
                this._primitive.emitterModelMatrix = emitterModelMatrix;
            }

            const updatePosition = this.disposeVar(createNextAnimateFrameEvent(
                this.positionChanged,
                this.rotationChanged,
                this.translationChanged,
            ));
            this.dispose(updatePosition.disposableOn(setPosition));

            const updateCurrentTime = () => {
                if (!this._primitive) {
                    return;
                }
                // @ts-ignore
                this._primitive.timeStamp = this.currentTime;
            };
            updateCurrentTime();
            this.dispose(this.currentTimeChanged.disposableOn(updateCurrentTime));

            this.dispose(this.flyToEvent.disposableOn(() => {
                if (!this.position) {
                    console.warn(`当前没有位置信息，无法飞入！`);
                    return;
                }
                const viewDistance = this.position[2] + 100;
                flyTo(viewer, this.position, viewDistance, undefined, 1000);
            }));
        }
    }

    static defaults = {
        playingLoop: true,
        currentTime: 0,
        playerCurrentTime: 0,
        duration: 6000,
        playingSpeed: 1,
        playing: true,
        ratio: 0,

        particleLife: 0.5,
        endScale: 4,
        imageSize: [20, 20] as [number, number],
        image: `\${earthsdk3-assets-script-dir}/assets/img/smoke.png`,
        emitter: {
            type: 'CircleEmitter',
            radius: 0.5
        } as ESJParticleEmitterJsonType,
    }
}


export namespace CzmParticleSystemPrimitive {
    export const createDefaultProps = () => ({
        emitter: reactJsonWithUndefined<ESJParticleEmitterJsonType | undefined>(undefined),
        bursts: reactArrayCollectionWithUndefined<[time?: number, minimum?: number, maximum?: number]>(undefined),
        position: reactArrayWithUndefined<[number, number, number] | undefined>(undefined), // 经度纬度高度，度为单
        translation: reactArrayWithUndefined<[number, number, number] | undefined>(undefined),
        rotation: reactArrayWithUndefined<[number, number, number] | undefined>(undefined), // 偏航俯仰翻转，度为单位
        positionEditing: false,
        image: undefined as string | undefined,
        imageSize: undefined as [number, number] | undefined,
        minimumImageSize: undefined as [number, number] | undefined,
        maximumImageSize: undefined as [number, number] | undefined,
        show: undefined as boolean | undefined,
        updateCallback: undefined as string | undefined,
        emissionRate: undefined as number | undefined,
        loop: undefined as boolean | undefined,
        scale: undefined as number | undefined,
        startScale: undefined as number | undefined,
        endScale: undefined as number | undefined,
        color: reactArrayWithUndefined<[number, number, number, number] | undefined>(undefined),
        startColor: reactArrayWithUndefined<[number, number, number, number] | undefined>(undefined),
        endColor: reactArrayWithUndefined<[number, number, number, number] | undefined>(undefined),
        sizeInMeters: undefined as boolean | undefined,
        speed: undefined as number | undefined,
        minimumSpeed: undefined as number | undefined,
        maximumSpeed: undefined as number | undefined,
        lifetime: undefined as number | undefined,
        particleLife: undefined as number | undefined,
        minimumParticleLife: undefined as number | undefined,
        maximumParticleLife: undefined as number | undefined,
        mass: undefined as number | undefined,
        minimumMass: undefined as number | undefined,
        maximumMass: undefined as number | undefined,

        playingLoop: undefined as boolean | undefined,
        currentTime: undefined as number | undefined,
        duration: undefined as number | undefined,
        playingSpeed: undefined as number | undefined,
        playing: undefined as boolean | undefined,
    });
}
extendClassProps(CzmParticleSystemPrimitive.prototype, CzmParticleSystemPrimitive.createDefaultProps);
export interface CzmParticleSystemPrimitive extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmParticleSystemPrimitive.createDefaultProps>> { }
