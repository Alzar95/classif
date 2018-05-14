import { Component, Output, EventEmitter, ViewChild, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { EosDictService } from '../services/eos-dict.service';
import { E_DICT_TYPE, E_FIELD_SET, IRecordModeDescription, ISearchSettings, SEARCH_MODES } from 'eos-dictionaries/interfaces';
import { SEARCH_TYPES } from '../consts/search-types';
import { EosMessageService } from '../../eos-common/services/eos-message.service';
import { SEARCH_NOT_DONE } from '../consts/messages.consts';
import { FormGroup } from '@angular/forms';
import { InputBase } from 'eos-common/core/inputs/input-base';
import { InputControlService } from 'eos-common/services/input-control.service';
import { EosDictionary } from '../core/eos-dictionary';

const SEARCH_MODEL = {
    rec: {},
    cabinet: {},
    printInfo: {}
};

@Component({
    selector: 'eos-dictionary-search',
    templateUrl: 'dictionary-search.component.html'
})
export class DictionarySearchComponent implements OnDestroy {
    @Output() setFilter: EventEmitter<any> = new EventEmitter(); // todo add filter type
    @Output() switchFastSrch: EventEmitter<boolean> = new EventEmitter();

    @ViewChild('full') fSearchPop;
    @ViewChild('quick') qSearchPop;

    filterInputs = [{
        controlType: 'date',
        key: 'filter.stateDate',
        value: new Date(),
        label: 'Состояние на',
        hideLabel: true,
        readonly: false
    }];

    fieldsDescription = {
        rec: {}
    };
    data: any;
    department: any;
    person: any;
    cabinet: any;

    settings: ISearchSettings = {
        mode: SEARCH_MODES.totalDictionary,
        deleted: false
    };
    currTab: string;
    modes: IRecordModeDescription[];
    searchDone = true; // Flag search is done, false while not received data

    isOpenQuick = false;
    dataQuick = null;

    hasDate: boolean;
    hasQuick: boolean;
    hasFull: boolean;
    type: E_DICT_TYPE;

    searchForm: FormGroup;
    inputs: InputBase<any>[];

    public mode = 0;

    private date: Date = new Date();
    private dictionary: EosDictionary;
    private subscriptions: Subscription[] = [];

    get dictId(): string {
        return this.dictionary.id;
    }

    get noSearchData(): boolean {
        const model = this[this.currTab || 'data'];
        let noData = true;
        Object.keys(model).forEach((_dict) => {
            Object.keys(model[_dict]).forEach((_field) => {
                if (model[_dict][_field] && model[_dict][_field].trim() !== '') {
                    noData = false;
                }
            });
        });
        return noData;
    }

    constructor(
        private _dictSrv: EosDictService,
        private _msgSrv: EosMessageService,
        private inputCtrlSrv: InputControlService,
    ) {
        ['department', 'data', 'person', 'cabinet'].forEach((model) => this.clearModel(model));
        this.inputs = this.inputCtrlSrv.generateInputs(this.filterInputs);
        this.searchForm = this.inputCtrlSrv.toFormGroup(this.inputs, false);
        const dateFilter = this.searchForm.controls['filter.stateDate'];

        this.searchForm.valueChanges.subscribe((data) => {
            if (dateFilter.valid) {
                this.dateFilter(data['filter.stateDate']);
            } else if (dateFilter.errors.minDate || dateFilter.errors.maxDate) {
                dateFilter.setValue(new Date());
            } else {
                this.dateFilter(new Date());
            }
        });

        this.subscriptions.push(_dictSrv.dictionary$.subscribe((_d) => {
            if (_d) {
                this.dictionary = _dictSrv.currentDictionary;
                ['department', 'data', 'person', 'cabinet'].forEach((model) => this.clearModel(model));
                this.initSearchForm();
            }
        }));
    }

    setTab(key: string) {
        this.currTab = key;
    }

    ngOnDestroy() {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    }

    fullSearch() {
        this.settings.mode = this.mode;
        this.fSearchPop.hide();
        if (this.searchDone) {
            this.searchDone = false;
            if (this.dictId === 'departments') {
                this[this.currTab]['srchMode'] = this.currTab;
            }
            this._dictSrv.fullSearch(this[this.currTab || 'data'], this.settings)
                .then(() => {
                    this.searchDone = true;
                    if (this.dictId === 'departments') {
                        this[this.currTab]['srchMode'] = '';
                    }
                });
        } else {
            this._msgSrv.addNewMessage(SEARCH_NOT_DONE);
        }
    }

    clearForm() {
        this.clearModel(this.currTab || 'data');
    }

    dateFilter(date: Date) {
        if (!date || !this.date || date.getTime() !== this.date.getTime()) {
            this.date = date;
            this._dictSrv.setFilter({ date: date ? date.setHours(0, 0, 0, 0) : null });
        }
    }

    showFastSrch() {
        this.isOpenQuick = !this.isOpenQuick;
        this.switchFastSrch.emit(this.isOpenQuick);
    }

    public considerDel() {
        this._dictSrv.updateViewParameters({ showDeleted: this.settings.deleted });
    }

    private clearModel(model: string) {
        this.mode = 0;
        this.settings.deleted = false;
        this[model] = {};
        Object.keys(SEARCH_MODEL).forEach((key) => this[model][key] = {});
    }

    private initSearchForm() {
        ['department', 'data', 'person', 'cabinet'].forEach((model) => this.clearModel(model));
        if (this.dictionary) {
            const dateFilter = this.searchForm.controls['filter.stateDate'];
            if (this.dictId) {
                Object.assign(this.data, {
                    printInfo: {},
                    cabinet: {}
                });
            }
            this.fieldsDescription = this.dictionary.descriptor.record.getFieldDescription(E_FIELD_SET.fullSearch);
            this.type = this.dictionary.descriptor.dictionaryType;
            this.modes = this.dictionary.descriptor.record.getModeList();
            if (this.modes) {
                this.currTab = this.modes[0].key;
            }

            const _config = this.dictionary.descriptor.record.getSearchConfig();
            /* tslint:disable:no-bitwise */
            this.hasDate = !!~_config.findIndex((_t) => _t === SEARCH_TYPES.dateFilter);
            this.hasQuick = !!~_config.findIndex((_t) => _t === SEARCH_TYPES.quick);
            this.hasFull = !!~_config.findIndex((_t) => _t === SEARCH_TYPES.full);
            /* tslint:enable:no-bitwise */

            if (this.dictId === 'departments') {
                if (this._dictSrv.getFilterValue('date')) {
                    dateFilter.setValue(new Date(this._dictSrv.getFilterValue('date')));
                } else {
                    this.dateFilter(dateFilter.value);
                }
            }
        }
    }
}
