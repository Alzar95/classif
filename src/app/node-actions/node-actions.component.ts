import { Component, TemplateRef, ViewChild, HostListener } from '@angular/core';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal/modal-options.class';
import { ModalDirective } from 'ngx-bootstrap/modal';

import { EosUserSettingsService } from '../services/eos-user-settings.service';
import { EosDictService } from '../services/eos-dict.service';
import { EosDeskService } from '../services/eos-desk.service';
import { EosDictionaryNode } from '../core/eos-dictionary-node';
import { EosDictionary } from '../core/eos-dictionary';
import { NodeActionsService } from './node-actions.service';
import { FieldDescriptor } from '../core/field-descriptor';
import { E_ACTION_GROUPS, E_RECORD_ACTIONS } from '../core/record-action';
import { IFieldView } from '../core/field-descriptor';
import { E_FIELD_SET } from '../core/dictionary-descriptor';
import { EditCardActionService } from '../edit-card/action.service';

import { RECORD_ACTIONS, DROPDOWN_RECORD_ACTIONS } from '../consts/record-actions.consts';
import { EDIT_CARD_ACTIONS } from '../edit-card/action.service';

@Component({
    selector: 'eos-node-actions',
    templateUrl: 'node-actions.component.html',
})
export class NodeActionsComponent {
    recordActions = RECORD_ACTIONS;
    dropdownRecordActions = DROPDOWN_RECORD_ACTIONS;

    showDeleted = false;
    modalRef: BsModalRef;
    checkAll = false;
    itemIsChecked = false;
    // newNode: EosDictionaryNode;

    searchResults: EosDictionaryNode[];
    searchString: string;
    searchInAllDict = false;

    dictionary: EosDictionary;
    viewFields: FieldDescriptor[];

    showCheckbox: boolean;
    userSort = false;

    rootSelected = false;
    allChildrenSelected = false;
    someChildrenSelected = false;

    dropdownIsOpen = false;
    date = new Date();

    fields: IFieldView[];
    searchInDeleted = false;

    dictIdFromDescriptor: string;

    innerClick = false;

    newNode: EosDictionaryNode;

    @ViewChild('creatingModal') public creatingModal: ModalDirective;

    get noSearchData(): boolean {
        /* tslint:disable:no-bitwise */
        return !~this.fields.findIndex((f) => f.value);
        /* tslint:enable:no-bitwise */
    }

    @HostListener('window:click', [])
    private _closeSearchModal(): void {
        if ( ! this.innerClick) {
            this.dropdownIsOpen = false;
        }
        this.innerClick = false;
    }

    constructor(private _userSettingsService: EosUserSettingsService,
        private modalService: BsModalService,
        private _dictionaryService: EosDictService,
        private _deskService: EosDeskService,
        private _actionService: NodeActionsService,
        private _editCardActionService: EditCardActionService) {
        this._userSettingsService.settings.subscribe((res) => {
            this.showDeleted = res.find((s) => s.id === 'showDeleted').value;
        });

        this._dictionaryService.dictionary$.subscribe((_d) => {
            this.dictionary = _d;
            if (_d) {
                this.dictIdFromDescriptor = _d.descriptor.id;
                this.viewFields = _d.descriptor.getFieldSet(E_FIELD_SET.list);

                this.showCheckbox = _d.descriptor.canDo(E_ACTION_GROUPS.common, E_RECORD_ACTIONS.markRecords);
                this.fields = _d.descriptor.getFieldSet(E_FIELD_SET.fullSearch).map((fld) => Object.assign({}, fld, { value: null }));
            }
        });

        this._actionService.action$.subscribe((act) => {
            switch (act) {
                case E_RECORD_ACTIONS.markOne:
                    this.itemIsChecked = true;
                    this.checkAll = false;
                    this.someChildrenSelected = true;
                    break;
                case E_RECORD_ACTIONS.unmarkAllChildren:
                    this.allChildrenSelected = false;
                    this.someChildrenSelected = false;
                    this.itemIsChecked = false;
                    this.checkAll = false;
                    break;
                case E_RECORD_ACTIONS.markAllChildren:
                    this.allChildrenSelected = true;
                    if (this.rootSelected) {
                        this.checkAll = true;
                        this.itemIsChecked = false;
                    } else {
                        this.itemIsChecked = true;
                        this.checkAll = false;
                    }
                    break;
                case E_RECORD_ACTIONS.markRoot:
                    this.rootSelected = true;
                    if (this.allChildrenSelected) {
                        this.checkAll = true;
                        this.itemIsChecked = false;
                    } else {
                        this.checkAll = false;
                        this.itemIsChecked = true;
                    }
                    break;
                case E_RECORD_ACTIONS.unmarkRoot:
                    this.rootSelected = false;
                    if (this.allChildrenSelected || this.someChildrenSelected) {
                        this.itemIsChecked = true;
                        this.checkAll = false;
                    } else {
                        this.itemIsChecked = false;
                        this.checkAll = false;
                    }
                    break;
            }
        });
    }

    /* ngOnDestroy() {
        this._actionService.emitAction(null);
    }*/

    actionHandler (type: E_RECORD_ACTIONS) {
        switch (type) {
            case E_RECORD_ACTIONS.add:
                this.creatingModal.show();
                this._editCardActionService.emitAction(EDIT_CARD_ACTIONS.makeEmptyObject);
                break;
            case E_RECORD_ACTIONS.userOrder:
                this.switchUserSort();
                break;
            default:
                this._actionService.emitAction(type);
                break;
        }
    }

    isEnabled (group: E_ACTION_GROUPS, type: E_RECORD_ACTIONS) {
        if (this.dictionary) {
            switch (type) {
                case E_RECORD_ACTIONS.moveUp:
                    return this.userSort && this.dictionary.descriptor.canDo(group, type);
                case E_RECORD_ACTIONS.moveDown:
                    return this.userSort && this.dictionary.descriptor.canDo(group, type);
                case E_RECORD_ACTIONS.showDeleted:
                    return this.showDeleted && this.dictionary.descriptor.canDo(group, type);
                default:
                    return this.dictionary.descriptor.canDo(group, type);
            }
        }
        return false;
    }

    switchUserSort() {
        this.userSort = !this.userSort;
        this._actionService.emitAction(E_RECORD_ACTIONS.userOrder);
    }

    openModal(template: TemplateRef<any>) {
        this.modalRef = this.modalService.show(template);
        this.dropdownIsOpen = true;
    }

    public change(value: boolean): void {
        this.dropdownIsOpen = value;
    }

    checkAllItems() {
        if (this.checkAll) {
            this.rootSelected = true;
            this.allChildrenSelected = true;
            this.itemIsChecked = false;
            this._actionService.emitAction(E_RECORD_ACTIONS.markRecords);
        } else {
            this.itemIsChecked = false;
            this.allChildrenSelected = false;
            this.someChildrenSelected = false;
            this._actionService.emitAction(E_RECORD_ACTIONS.unmarkRecords);
        }
    }

    uncheckAllItems() {
        this.checkAll = false;
        this.itemIsChecked = false;
        this.allChildrenSelected = false;
        this.someChildrenSelected = false;
        this._actionService.emitAction(E_RECORD_ACTIONS.unmarkRecords);
    }

    search(event) {
        if (event.keyCode === 13) {
            this.dropdownIsOpen = false;
            this._dictionaryService.search(this.searchString, this.searchInAllDict);
            event.target.blur();
        }
    }

    fullSearch() {
        this.modalRef.hide();
        this._dictionaryService.fullSearch(this.fields, this.searchInDeleted);
    }

    create() {
        this.newNode = this._dictionaryService.getEmptyNode();
        this._editCardActionService.emitAction(EDIT_CARD_ACTIONS.create);
        this.creatingModal.hide();
    }

    saveNewNode(data: any) {
        // this.dictionary.descriptor.getFieldView();
        this._dictionaryService.updateNode(this.dictionary.id, this.newNode.id, this.dictionary.descriptor.record, data);
        let title = '';
        this.newNode.getShortQuickView().forEach((_f) => {
            title += data[_f.key];
        });
        this._deskService.addRecentItem({
            link: '/spravochniki/' + this.dictionary.id + '/' + this.newNode.id,
            title: title,
            edited: false,
        });
    }

    createOneMore() {
        this.newNode = this._dictionaryService.getEmptyNode();
        this._editCardActionService.emitAction(EDIT_CARD_ACTIONS.create);
        this._editCardActionService.emitAction(EDIT_CARD_ACTIONS.makeEmptyObject);
    }

    cancelCreate() {
        this.creatingModal.hide();
        this._editCardActionService.emitAction(EDIT_CARD_ACTIONS.makeEmptyObject); // I'm not sure. We generate extra objects
    }
}
