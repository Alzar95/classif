export class InputBase<T>{
    value: T;
    key: string;
    dict: string;
    label: string;
    required: boolean;
    order: number;
    controlType: string;
    pattern: RegExp;
    readonly: boolean;
    isUnic: boolean;
    unicInDict: boolean;
    invalidMessage: string;

    constructor(options: {
        value?: T,
        key?: string,
        dict?: string,
        label?: string,
        required?: boolean,
        order?: number,
        controlType?: string,
        pattern?: RegExp,
        readonly?: boolean,
        isUnic?: boolean,
        unicInDict?: boolean,
        invalidMessage?: string,
    } = {}) {
        this.value = options.value;
        this.key = options.key || '';
        this.dict = options.dict || 'rec';
        this.label = options.label || '';
        this.required = !!options.required;
        this.order = options.order === undefined ? 1 : options.order;
        this.controlType = options.controlType || '';
        this.pattern = options.pattern || null;
        this.readonly = !!options.readonly;
        this.isUnic = !!options.isUnic;
        this.unicInDict = !!options.unicInDict;
        this.invalidMessage = options.invalidMessage || '';
    }
}
