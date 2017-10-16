import { Injectable } from '@angular/core';
import { EosDictionaryNode } from '../core/eos-dictionary-node';
import { EosStorageService } from '../../app/services/eos-storage.service';


@Injectable()
export class EosDictOrderService {
    private NAME = '-ORDER';
    private LOCALSTORAGEKEY = 'OrderMod';

    constructor(
        private _eosStorageService: EosStorageService
    ) { }

    public toggleSortingMode(val: boolean) {
        localStorage.setItem(this.LOCALSTORAGEKEY, val.toString());
    }

    public getMode() {
        return JSON.parse(localStorage.getItem(this.LOCALSTORAGEKEY));
    }

    public generateOrder(sortedList: EosDictionaryNode[], ID: string) {
        const order: string[] = [];
        for (const item of sortedList) {
            order.push(item.id);
        }
        this._eosStorageService.setItem(ID + this.NAME, order, true);
    }

    private restoreOrder(list: EosDictionaryNode[], ID: string): EosDictionaryNode[] {
        const order: string[] = JSON.parse(localStorage.getItem(ID + this.NAME));
        const sortableList: EosDictionaryNode[] = [];
        for (const id of order) {
            for (const notSortedItem of list) {
                if (notSortedItem.id === id) {
                    sortableList.push(notSortedItem);
                    break;
                }
            }
        }
        for (const item of list) {
            const index = sortableList.indexOf(item);
            if (index === -1) {
                sortableList.push(item);
            }
        }
        return sortableList;
    }

    public getUserOrder(list: EosDictionaryNode[], ID: string): EosDictionaryNode[] {
        if (!ID) {
            console.warn('ID is undifined!')
            return;
        }
        if (localStorage.getItem(ID + this.NAME)) {
            const sortableList: EosDictionaryNode[] = this.restoreOrder(list, ID);
            return sortableList;
        } else {
            this.generateOrder(list, ID);
            return list;
        }
    }
    /**
     * Sorting on the field CLASSIF_NAME
     * @param a Element a
     * @param b Element b
     */
    public defaultSort(a: EosDictionaryNode, b: EosDictionaryNode) {
        if (a.data.CLASSIF_NAME > b.data.CLASSIF_NAME) {
            return 1;
        }
        if (a.data.CLASSIF_NAME < b.data.CLASSIF_NAME) {
            return -1;
        }
        if (a.data.CLASSIF_NAME === b.data.CLASSIF_NAME) {
            return 0;
        }
    }
}
