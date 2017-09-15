import { Component, Output, Input, EventEmitter, OnChanges } from '@angular/core';

import { EosDictService } from '../services/eos-dict.service';
import { EosDictionaryNode } from '../core/eos-dictionary-node';
import { EosDictionary } from '../core/eos-dictionary';
import { FieldGroup } from '../core/field-descriptor';
import { EditCardActionService } from '../edit-card/action.service';
import { E_FIELD_SET } from '../core/dictionary-descriptor';
import { EDIT_CARD_ACTIONS, EDIT_CARD_MODES } from '../edit-card/action.service';

@Component({
    selector: 'eos-rubricator-card-edit',
    templateUrl: 'rubricator-card-edit.component.html',
})
export class RubricatorCardEditComponent implements OnChanges {
    // node: EosDictionaryNode;
    tmpObj: any = {};
    data: any = {};
    editMode = true;
    showOwners = true;
    showUsers = true;
    showAccess = true;

    dictionary: EosDictionary;

    @Input() nodeId: string;
    @Input() dictionaryId: string;
    @Output() result: EventEmitter<any> = new EventEmitter<any>();

    constructor(private _dictSrv: EosDictService, private _actSrv: EditCardActionService) {
        /*this._dictionaryService.openedNode$.subscribe((node) => {
            this.node = node;
            if (this.node) {
                if (this.node.data) {
                    Object.assign(this.tmpObj, this.node.data);
                }
            }
        });*/

        this._dictSrv.dictionary$.subscribe((_d) => {
            this.dictionary = _d;
            // console.log('edit set', _d.descriptor.getFieldSet(E_FIELD_SET.edit, {}));
        });
        this._actSrv.action$.subscribe((act) => {
            switch (act) {
                case EDIT_CARD_ACTIONS.save:
                    this.editMode = false;
                    this.result.emit(this.tmpObj);
                    break;
                case EDIT_CARD_ACTIONS.cancel:
                    this.editMode = false;
                    this.result.emit(this.data);
                    Object.assign(this.tmpObj, this.data);
                    break;
                case EDIT_CARD_ACTIONS.create:
                    this.result.emit(this.tmpObj);
                    break;
                case EDIT_CARD_ACTIONS.makeEmptyObject:
                    this.editMode = true;
                    // console.log('newNode', this._dictionaryService.getEmptyNode());
                    this.tmpObj = {};
                    break;
            }
        }
        );

        this._actSrv.mode$.subscribe((mode) => {
            switch (mode) {
                case EDIT_CARD_MODES.edit:
                    this.editMode = true;
                    break;
                case EDIT_CARD_MODES.view:
                    this.editMode = false;
                    break;
                }
            });
    }

    ngOnChanges() {
        if (this.dictionaryId.length && this.nodeId.length) {
            this._dictSrv.openNode(this.dictionaryId, this.nodeId).then((node) => {
                node.getEditView().forEach(fld => {
                    this.data[fld.key] = fld.value;
                });
                Object.assign(this.tmpObj, this.data);
            }).catch();
        } else {
            /* this.dictionary.descriptor.getFieldSet(E_FIELD_SET.edit).forEach((field) => {
                this.data[field.key] = null;
                Object.assign(this.tmpObj, this.data);
            });*/

            this.dictionary.descriptor.record.getEditView({}).forEach((fld) => {
                this.data[fld.key] = fld.value;
            });
        }
    }

    /* changeEditMode(value: boolean) {
        this.editMode = value;
        if (value) {
            this._actonService.emitMode('edit');
        } else {
            this._actonService.emitMode('view');
        }
    }*/

    setUnsavedChanges() {
        this._actSrv.emitMode(EDIT_CARD_MODES.unsavedChanges);
    }
}
