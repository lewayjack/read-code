import { Number3Property } from "./NativeProperty";

// rgb
export class ColorRgbProperty extends Number3Property {
    override get type() { return 'ColorRgbProperty'; }
}
