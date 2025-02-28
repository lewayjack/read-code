import { CzmModelPrimitive } from ".";
import { bind, createNextAnimateFrameEvent, Destroyable, ObjResettingWithEvent } from "xbsj-base";
import { NativePrimitiveCreating } from "./NativePrimitiveCreating";

export class NativePrimitiveResetting extends Destroyable {
    get owner() { return this._owner; }

    // private _resetting = (() => {
    //     const { owner } = this;
    //     const { finalModelUriReact, finalSpecularEnvironmentMapsReact } = owner;

    //     const recreateEvent = this.disposeVar(createNextAnimateFrameEvent(
    //         // sceneObject.urlChanged,
    //         finalModelUriReact.changed,
    //         owner.basePathChanged,
    //         owner.allowPickingChanged,
    //         owner.incrementallyLoadTexturesChanged,
    //         owner.showOutlineChanged,
    //         owner.asynchronousChanged,
    //         owner.creditChanged,
    //         // model.dequantizeInShaderChanged,
    //         owner.forwardAxisChanged,
    //         owner.upAxisChanged,
    //         owner.imageBasedLightingFactorChanged,
    //         owner.lightColorChanged,
    //         owner.luminanceAtZenithChanged,
    //         owner.sphericalHarmonicCoefficientsChanged,
    //         finalSpecularEnvironmentMapsReact.changed,
    //         owner.customShaderInstanceClassChanged,
    //         owner.opaquePassChanged,
    //         owner.gltfJsonChanged,
    //     ));
    //     const objResetting = this.disposeVar(new ObjResettingWithEvent(recreateEvent, () => {
    //         return new NativePrimitiveCreating(this);
    //     }));
    //     return objResetting;
    // })();

    constructor(private _owner: CzmModelPrimitive) {
        super();
        const { owner } = this;
        const { finalModelUriReact, finalSpecularEnvironmentMapsReact } = owner;
        this.ad(bind([_owner, 'luminanceAtZenith'], [_owner, 'atmosphereScatteringIntensity']));

        const recreateEvent = this.disposeVar(createNextAnimateFrameEvent(
            // sceneObject.urlChanged,
            finalModelUriReact.changed,
            owner.basePathChanged,
            owner.allowPickingChanged,
            owner.incrementallyLoadTexturesChanged,
            owner.showOutlineChanged,
            owner.asynchronousChanged,
            owner.creditChanged,
            // model.dequantizeInShaderChanged,
            owner.forwardAxisChanged,
            owner.upAxisChanged,
            owner.imageBasedLightingFactorChanged,
            owner.lightColorChanged,
            owner.luminanceAtZenithChanged,
            owner.atmosphereScatteringIntensityChanged,
            owner.sphericalHarmonicCoefficientsChanged,
            finalSpecularEnvironmentMapsReact.changed,
            owner.customShaderInstanceClassChanged,
            owner.opaquePassChanged,
            owner.gltfJsonChanged,
        ));
        this.disposeVar(new ObjResettingWithEvent(recreateEvent, () => {
            return new NativePrimitiveCreating(this);
        }));
    }
}
