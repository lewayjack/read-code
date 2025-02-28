import { extendClassProps, UniteChanged } from "xbsj-base";
import { ESLocalVector } from "./ESLocalVector";

export abstract class ESLocalVector2D extends ESLocalVector {
    static override defaults = {
        ...ESLocalVector.defaults,
    };
    override getESProperties() { return { ...super.getESProperties() } };
    override getProperties(language?: string) { return [...super.getProperties(language)]; }
}

export namespace ESLocalVector2D {
    export const createDefaultProps = () => ({
        ...ESLocalVector.createDefaultProps(),
    });
}
extendClassProps(ESLocalVector2D.prototype, ESLocalVector2D.createDefaultProps);
export interface ESLocalVector2D extends UniteChanged<ReturnType<typeof ESLocalVector2D.createDefaultProps>> { }
