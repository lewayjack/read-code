import { ReactVarProperty } from "./ReactVarProperty";

export class BooleanProperty extends ReactVarProperty<boolean | undefined> {
    override get type() { return 'BooleanProperty'; }
}

export class StringProperty extends ReactVarProperty<string | undefined> {
    override get type() { return 'StringProperty'; }
}

// export class LongStringProperty extends ReactVarProperty<string | undefined> {
//     override get type() { return 'LongStringProperty'; }
// }

export class NumberProperty extends ReactVarProperty<number | undefined> {
    override get type() { return 'NumberProperty'; }
}

export class MaximumScreenSpaceErrorProperty extends ReactVarProperty<number | undefined> {
    override get type() { return 'MaximumScreenSpaceErrorProperty'; }
}

export class StringsProperty extends ReactVarProperty<string[] | undefined> {
    override get type() { return 'StringsProperty'; }
}

export class NumbersProperty extends ReactVarProperty<number[] | undefined> {
    override get type() { return 'NumbersProperty'; }
}

export class BooleansProperty extends ReactVarProperty<boolean[] | undefined> {
    override get type() { return 'BooleansProperty'; }
}

export class String2Property extends ReactVarProperty<[string, string] | undefined> {
    override get type() { return 'String2Property'; }
}

export class String3Property extends ReactVarProperty<[string, string, string] | undefined> {
    override get type() { return 'String3Property'; }
}

export class String4Property extends ReactVarProperty<[string, string, string, string] | undefined> {
    override get type() { return 'String4Property'; }
}

export class String2sProperty extends ReactVarProperty<[string, string][] | undefined> {
    override get type() { return 'String2sProperty'; }
}

export class String3sProperty extends ReactVarProperty<[string, string, string][] | undefined> {
    override get type() { return 'String3sProperty'; }
}

export class String4sProperty extends ReactVarProperty<[string, string, string, string][] | undefined> {
    override get type() { return 'String4sProperty'; }
}

export class Number2Property extends ReactVarProperty<[number, number] | undefined> {
    override get type() { return 'Number2Property'; }
}

export class Number3Property extends ReactVarProperty<[number, number, number] | undefined> {
    override get type() { return 'Number3Property'; }
}

export class Number4Property extends ReactVarProperty<[number, number, number, number] | undefined> {
    override get type() { return 'Number4Property'; }
}
export class Number4WithUndefinedProperty extends ReactVarProperty<[number | undefined, number | undefined, number | undefined, number | undefined] | undefined> {
    override get type() { return 'Number4WithUndefinedProperty'; }
}


export class Number2sProperty extends ReactVarProperty<[number, number][] | undefined> {
    override get type() { return 'Number2sProperty'; }
}

export class Number3sProperty extends ReactVarProperty<[number, number, number][] | undefined> {
    override get type() { return 'Number3sProperty'; }
}

export class Number4sProperty extends ReactVarProperty<[number, number, number, number][] | undefined> {
    override get type() { return 'Number4sProperty'; }
}

export class Boolean2Property extends ReactVarProperty<[boolean, boolean] | undefined> {
    override get type() { return 'Boolean2Property'; }
}

export class Boolean3Property extends ReactVarProperty<[boolean, boolean, boolean] | undefined> {
    override get type() { return 'Boolean3Property'; }
}

export class Boolean4Property extends ReactVarProperty<[boolean, boolean, boolean, boolean] | undefined> {
    override get type() { return 'Boolean4Property'; }
}

export class Boolean2sProperty extends ReactVarProperty<[boolean, boolean][] | undefined> {
    override get type() { return 'Boolean2sProperty'; }
}

export class Boolean3sProperty extends ReactVarProperty<[boolean, boolean, boolean][] | undefined> {
    override get type() { return 'Boolean3sProperty'; }
}

export class Boolean4sProperty extends ReactVarProperty<[boolean, boolean, boolean, boolean][] | undefined> {
    override get type() { return 'Boolean4sProperty'; }
}

export class StringNumberProperty extends ReactVarProperty<[string, number] | undefined> {
    override get type() { return 'StringNumberProperty'; }
}

export class StringNumbersProperty extends ReactVarProperty<[string, number][] | undefined> {
    override get type() { return 'StringNumbersProperty'; }
}
