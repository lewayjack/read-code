import { StringProperty } from "./NativeProperty";


export class UriProperty extends StringProperty {
    override get type() { return 'UriProperty'; }
}
