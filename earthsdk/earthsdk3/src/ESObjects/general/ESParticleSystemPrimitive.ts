import { Player } from "../../utils";
import { ESObjectWithLocation } from "../base";
import { bind, extendClassProps, reactArrayCollectionWithUndefined, reactArrayWithUndefined, ReactivePropsToNativePropsAndChanged, reactJsonWithUndefined, SceneObjectKey } from "xbsj-base";
import { BooleanProperty, ColorProperty, ESJColor, ESJParticleEmitterJsonType, ESJVector2D, ESJVector3D, EvalStringProperty, FunctionProperty, GroupProperty, JsonProperty, Number2Property, Number3Property, Number3sProperty, NumberProperty, PlayerProperty, UriProperty } from "../../ESJTypes";

export class ESParticleSystemPrimitive extends ESObjectWithLocation {
    static readonly type = this.register('ESParticleSystemPrimitive', this, { chsName: '粒子', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "通过Cesium的Primitive API 实现的粒子特效。" });
    get typeName() { return 'ESParticleSystemPrimitive'; }
    override get defaultProps() { return ESParticleSystemPrimitive.createDefaultProps(); }

    private _player = this.dv(new Player());
    get player() { return this._player; }

    get ratio() { return this._player.ratio; }
    set ratio(value: number) { this._player.ratio = value; }
    get ratioChanged() { return this._player.ratioChanged; }

    constructor(id?: SceneObjectKey) {
        super(id);

        {
            const d = ESParticleSystemPrimitive.defaults;
            this.d(bind([this._player, 'loop'], [this, 'playingLoop'], b => b ?? d.playingLoop, a => a ?? d.playingLoop));
            this.d(bind([this._player, 'currentTime'], [this, 'currentTime'], b => b ?? d.currentTime, a => a ?? d.currentTime));
            this.d(bind([this._player, 'duration'], [this, 'duration'], b => b ?? d.duration, a => a ?? d.duration));
            this.d(bind([this._player, 'playing'], [this, 'playing'], b => b ?? d.playing, a => a ?? d.playing));
            this.d(bind([this._player, 'speed'], [this, 'playingSpeed'], b => b ?? d.playingSpeed, a => a ?? d.playingSpeed));
        }
    }

    static override defaults = {
        ...ESObjectWithLocation.defaults,

        playingLoop: true,
        currentTime: 0,
        playerCurrentTime: 0,
        duration: 6000,
        playingSpeed: 1,
        playing: true,
        ratio: 0,

        particleLife: 0.5,
        endScale: 4,
        imageSize: [20, 20] as ESJVector2D,
        image: `\${earthsdk3-assets-script-dir}/assets/img/smoke.png`,
        emitter: {
            type: 'CircleEmitter',
            radius: 0.5
        } as ESJParticleEmitterJsonType,
    }

    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new FunctionProperty("飞入", "飞入", ['number'], (duration: number) => this.flyTo(duration), [1000]),
                // new BooleanProperty('是否显示', 'A boolean Property specifying the visibility.', true, false, [this, 'show']),
                new EvalStringProperty('更新回调函数', 'The callback function to be called each frame to update a particle.', true, false, [this, 'updateCallback']),
                new NumberProperty('发射率', 'emissionRate,The number of particles to emit per second.', true, false, [this, 'emissionRate'], 5),
                new BooleanProperty('是否循环', 'loop,Whether the particle system should loop its bursts when it is complete.', true, false, [this, 'loop'], true),
                new NumberProperty('等级', 'scale,Sets the scale to apply to the image of the particle for the duration of its particleLife.', true, false, [this, 'particleScale'], 1),
                new NumberProperty('初始等级', 'startScale,The initial scale to apply to the image of the particle at the beginning of its life.', true, false, [this, 'startScale']),
                new NumberProperty('结束等级', 'endScale,The final scale to apply to the image of the particle at the end of its life.', true, false, [this, 'endScale'], ESParticleSystemPrimitive.defaults.endScale),
                new ColorProperty('颜色', 'Sets the color of a particle for the duration of its particleLife.', true, false, [this, 'color']),
                new ColorProperty('初始颜色', 'The color of the particle at the beginning of its life.', true, false, [this, 'startColor']),
                new ColorProperty('结束颜色', 'The color of the particle at the end of its life.', true, false, [this, 'endColor']),
                new BooleanProperty('尺寸单位为米', 'Sets if the size of particles is in meters or pixels. true to size the particles in meters; otherwise, the size is in pixels.', true, false, [this, 'sizeInMeters']),
                new NumberProperty('速度', 'speed,If set, overrides the minimumSpeed and maximumSpeed inputs with this value.', true, false, [this, 'speed'], 1),
                new NumberProperty('最小速度', 'minimumSpeed,Sets the minimum bound in meters per second above which a particles actual speed will be randomly chosen.', true, false, [this, 'minimumSpeed']),
                new NumberProperty('最大速度', 'maximumSpeed,Sets the maximum bound in meters per second below which a particles actual speed will be randomly chosen.', true, false, [this, 'maximumSpeed']),
                new NumberProperty('生命周期', 'lifetime,How long the particle system will emit particles, in seconds.', true, false, [this, 'lifetime'], Number.MAX_VALUE),
                new NumberProperty('粒子生命周期', 'particleLife,If set, overrides the minimumParticleLife and maximumParticleLife inputs with this value.', true, false, [this, 'particleLife'], ESParticleSystemPrimitive.defaults.particleLife),
                new NumberProperty('最小粒子生命周期', 'minimumParticleLife,Sets the minimum bound in seconds for the possible duration of a particles life above which a particles actual life will be randomly chosen.', true, false, [this, 'minimumParticleLife']),
                new NumberProperty('最大粒子生命周期', 'maximumParticleLife,Sets the maximum bound in seconds for the possible duration of a particles life below which a particles actual life will be randomly chosen.', true, false, [this, 'maximumParticleLife']),
                new NumberProperty('块数量', 'mass,Sets the minimum and maximum mass of particles in kilograms.', true, false, [this, 'mass'], 1),
                new NumberProperty('最小块数量', 'minimumMass,Sets the minimum bound for the mass of a particle in kilograms. A particles actual mass will be chosen as a random amount above this value.', true, false, [this, 'minimumMass']),
                new NumberProperty('最大块数量', 'maximumMass,Sets the maximum mass of particles in kilograms. A particles actual mass will be chosen as a random amount below this value.', true, false, [this, 'maximumMass']),
                new Number2Property('图片尺寸', 'imageSize', true, false, [this, 'imageSize'], ESParticleSystemPrimitive.defaults.imageSize),//toCartesian2
                new Number2Property('最小图片尺寸', 'minimumImageSize', true, false, [this, 'minimumImageSize']),//toCartesian2
                new Number2Property('最大图片尺寸', 'maximumImageSize', true, false, [this, 'maximumImageSize']),//toCartesian2
                new UriProperty('图片', 'The URI, HTMLImageElement, or HTMLCanvasElement to use for the billboard.', true, false, [this, 'image'], ESParticleSystemPrimitive.defaults.image),
                // new BooleanProperty('是否编辑位置', '是否编辑位置.', true, false, [this, 'positionEditing'], false),
                // new PositionProperty('位置', 'position,经度纬度高度，度为单位', true, false, [this, 'position']),
                new Number3Property('偏移', 'translation', true, false, [this, 'translation'], [0, 0, 0]),
                // new Number3Property('旋转', 'rotation,偏航俯仰翻转，度为单位', true, false, [this, 'rotation'], [0, 0, 0]),
                new Number3sProperty('bursts', "bursts", true, false, [this, "bursts"]),
                new JsonProperty('emitter', 'emitter', false, false, [this, "emitter"], ESParticleSystemPrimitive.defaults.emitter),
                // new NonreactiveJsonStringProperty('geoJson', '生成GeoJSON数据。', false, false, () => this.geoJsonStr, (value: string | undefined) => value && (this.geoJsonStr = value)),
            ]),
            new GroupProperty('播放器', '播放器', [
                new NumberProperty('播放比率', '播放比率(0-1)', true, false, [this, 'ratio'], ESParticleSystemPrimitive.defaults.ratio),
                new PlayerProperty('播放器', '播放器', [this, 'playing'], [this, 'ratio'], [this, 'playingLoop']),
                new BooleanProperty('是否循环', '是否循环.', true, false, [this, 'playingLoop'], ESParticleSystemPrimitive.defaults.playingLoop),
                new NumberProperty('当前时间', '当前时间', true, false, [this, 'currentTime'], ESParticleSystemPrimitive.defaults.currentTime),
                new NumberProperty('过渡时间', '过渡时间', true, false, [this, 'duration'], ESParticleSystemPrimitive.defaults.duration),
                new BooleanProperty('是否播放', '是否播放.', true, false, [this, 'playing'], ESParticleSystemPrimitive.defaults.playing),
                new NumberProperty('播放速度', '播放速度.', true, false, [this, 'playingSpeed'], ESParticleSystemPrimitive.defaults.playingSpeed),
            ]),
        ]
    }
}

export namespace ESParticleSystemPrimitive {
    export const createDefaultProps = () => ({
        ...ESObjectWithLocation.createDefaultProps(),
        emitter: reactJsonWithUndefined<ESJParticleEmitterJsonType | undefined>(undefined),
        bursts: reactArrayCollectionWithUndefined<[time?: number, minimum?: number, maximum?: number]>(undefined),
        // position: reactArrayWithUndefined<[number, number, number] | undefined>(undefined), // 经度纬度高度，度为单
        translation: reactArrayWithUndefined<ESJVector3D | undefined>(undefined),
        // rotation: reactArrayWithUndefined<[number, number, number] | undefined>(undefined), // 偏航俯仰翻转，度为单位
        positionEditing: undefined as boolean | undefined,
        image: undefined as string | undefined,
        imageSize: reactArrayWithUndefined<ESJVector2D>(undefined),
        minimumImageSize: reactArrayWithUndefined<ESJVector2D>(undefined),
        maximumImageSize: reactArrayWithUndefined<ESJVector2D>(undefined),
        // show: undefined as boolean | undefined,
        updateCallback: undefined as string | undefined,
        emissionRate: undefined as number | undefined,
        loop: undefined as boolean | undefined,
        particleScale: undefined as number | undefined,
        startScale: undefined as number | undefined,
        endScale: undefined as number | undefined,
        color: reactArrayWithUndefined<ESJColor | undefined>(undefined),
        startColor: reactArrayWithUndefined<ESJColor | undefined>(undefined),
        endColor: reactArrayWithUndefined<ESJColor | undefined>(undefined),
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
extendClassProps(ESParticleSystemPrimitive.prototype, ESParticleSystemPrimitive.createDefaultProps);
export interface ESParticleSystemPrimitive extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof ESParticleSystemPrimitive.createDefaultProps>> { }
