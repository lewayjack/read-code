import { Number4Property } from "./NativeProperty";

// rgba
export class ColorProperty extends Number4Property {
    override get type() { return 'ColorProperty'; }
}
