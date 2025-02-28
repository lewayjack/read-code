import { ReactVarProperty } from "./ReactVarProperty";

export class DatesProperty extends ReactVarProperty<number[] | undefined> {
    override get type() { return 'DatesProperty'; }
}