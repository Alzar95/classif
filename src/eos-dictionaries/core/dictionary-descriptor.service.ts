import { Injectable } from '@angular/core';
import { IDictionaryDescriptor, E_DICT_TYPE } from 'eos-dictionaries/interfaces';
import { AbstractDictionaryDescriptor } from 'eos-dictionaries/core/abstract-dictionary-descriptor';
import { DICTIONARIES } from 'eos-dictionaries/consts/dictionaries.consts';
import { PipRX } from 'eos-rest/services/pipRX.service';
import { DictionaryDescriptor } from 'eos-dictionaries/core/dictionary-descriptor';
import { TreeDictionaryDescriptor } from 'eos-dictionaries/core/tree-dictionary-descriptor';
import { DepartmentDictionaryDescriptor } from 'eos-dictionaries/core/department-dictionary-descriptor';
import { OrganizationDictionaryDescriptor } from 'eos-dictionaries/core/organization-dictionary-descriptor';
import { CabinetDictionaryDescriptor } from 'eos-dictionaries/core/cabinet-dictionary-descriptor';
import { DocgroupDictionaryDescriptor } from 'eos-dictionaries/core/docgroup-dictionary-descriptor';

@Injectable()
export class DictionaryDescriptorService {
    private _mDicts: Map<string, IDictionaryDescriptor>;
    private _mDictClasses: Map<string, AbstractDictionaryDescriptor>;

    constructor(
        private apiSrv: PipRX,
    ) {
        this._mDicts = new Map<string, IDictionaryDescriptor>();
        this._mDictClasses = new Map<string, AbstractDictionaryDescriptor>();
        DICTIONARIES
            .sort((a, b) => {
                if (a.title > b.title) {
                    return 1;
                } else if (a.title < b.title) {
                    return -1;
                } else {
                    return 0;
                }
            })
            .forEach((dict) => this._mDicts.set(dict.id, dict));
    }

    visibleDictionaries(): IDictionaryDescriptor[] {
        return DICTIONARIES.filter((dict) => dict.visible);
    }

    getDescriptorData(name: string): IDictionaryDescriptor {
        return this._mDicts.get(name);
    }

    getDescriptorClass(name: string): AbstractDictionaryDescriptor {
        let res = this._mDictClasses.get(name);
        if (!res) {
            const descr = this.getDescriptorData(name);
            if (descr) {
                switch (descr.id) {
                    case 'departments':
                        res = new DepartmentDictionaryDescriptor(descr, this.apiSrv);
                        break;
                    case 'organization':
                        res = new OrganizationDictionaryDescriptor(descr, this.apiSrv);
                        break;
                    case 'cabinet':
                        res = new CabinetDictionaryDescriptor(descr, this.apiSrv);
                        break;
                    case 'docgroup':
                        res = new DocgroupDictionaryDescriptor(descr, this.apiSrv);
                        break;
                }

                if (!res) {
                    switch (descr.dictType) {
                        case E_DICT_TYPE.linear:
                            res = new DictionaryDescriptor(descr, this.apiSrv);
                            break;
                        case E_DICT_TYPE.tree:
                            res = new TreeDictionaryDescriptor(descr, this.apiSrv);
                            break;
                        case E_DICT_TYPE.department:
                            break;
                        default:
                            throw new Error('No API instance');
                    }
                }
            }
        }
        return res;
    }
}
