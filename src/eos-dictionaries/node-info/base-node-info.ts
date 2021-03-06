import { Input, OnChanges } from '@angular/core';
import { E_FIELD_TYPE } from 'eos-dictionaries/interfaces';
import { EosDictionaryNode } from 'eos-dictionaries/core/eos-dictionary-node';

export class BaseNodeInfoComponent implements OnChanges {
    @Input() node: EosDictionaryNode;

    fieldsDescriptionShort: any;
    nodeDataShort: any;
    fieldsDescriptionFull: any;
    nodeDataFull: any;

    fieldTypes = E_FIELD_TYPE;

    keys(data: Object): string[] {
        if (data) {
            return Object.keys(data);
        }
    }

    ngOnChanges() {
        if (this.node) {
            this.fieldsDescriptionShort = this.node.getShortViewFieldsDescription();
            this.nodeDataShort = this.node.getShortViewData();
            this.fieldsDescriptionFull = this.node.getFullViewFieldsDescription();
            this.nodeDataFull = this.node.getFullViewData();
        } else {
            this._initInfo();
        }
    }

    private _initInfo() {
        this.fieldsDescriptionFull = {};
        this.fieldsDescriptionShort = {};
        this.nodeDataFull = {};
        this.nodeDataShort = {};
    }

}
