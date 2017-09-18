import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';

import { EosApiService } from './eos-api.service';
import { EosDictionary } from '../core/eos-dictionary';
import { EosDictionaryNode } from '../core/eos-dictionary-node';

import { DICTIONARIES } from '../consts/dictionaries.consts';

import { WARN_SEARCH_NOTFOUND } from '../consts/messages.consts';


import { RecordDescriptor } from '../core/record-descriptor';
import { EosMessageService } from './eos-message.service';

import { IFieldView } from '../core/field-descriptor';

@Injectable()
export class EosDictService {
    private _dictionaries: Map<string, EosDictionary>;
    private _dictionariesList = DICTIONARIES;
    private _dictionary: EosDictionary;
    private _selectedNode: EosDictionaryNode; // selected in tree
    private _openedNode: EosDictionaryNode; // selected in list of _selectedNode children
    private _searchResults: EosDictionaryNode[];
    private _searchString: string;

    /* private _dictionariesList$: BehaviorSubject<Array<{ id: string, title: string }>>; */
    private _dictionary$: BehaviorSubject<EosDictionary>;
    private _selectedNode$: BehaviorSubject<EosDictionaryNode>;
    private _openedNode$: BehaviorSubject<EosDictionaryNode>;
    private _searchResults$: BehaviorSubject<EosDictionaryNode[]>;

    private _listPromise: Promise<any>;
    private _mDictionaryPromise: Map<string, Promise<EosDictionary>>;
    public notFound = false;

    constructor(
        private _api: EosApiService,
        private _msgSrv: EosMessageService
    ) {
        this._dictionaries = new Map<string, EosDictionary>();
        /* this._dictionariesList$ = new BehaviorSubject<Array<{ id: string, title: string }>>([]); */
        this._selectedNode$ = new BehaviorSubject<EosDictionaryNode>(null);
        this._openedNode$ = new BehaviorSubject<EosDictionaryNode>(null);
        this._dictionary$ = new BehaviorSubject<EosDictionary>(null);
        this._mDictionaryPromise = new Map<string, Promise<EosDictionary>>();
        this._searchResults$ = new BehaviorSubject<EosDictionaryNode[]>([]);
    }

    /* Observable dictionary for subscribing on updates in components */
    /*
    get dictionariesList$(): Observable<Array<{ id: string, title: string }>> {
        return this._dictionariesList$.asObservable();
    }
    */

    /* Observable dictionary for subscribing on updates in components */
    get dictionary$(): Observable<EosDictionary> {
        return this._dictionary$.asObservable();
    }

    /* Observable currentNode for subscribing on updates in components */
    get selectedNode$(): Observable<EosDictionaryNode> {
        return this._selectedNode$.asObservable();
    }

    /* Observable openNode for subscribing on updates in components */
    get openedNode$(): Observable<EosDictionaryNode> {
        return this._openedNode$.asObservable();
    }

    get searchResults$(): Observable<EosDictionaryNode[]> {
        return this._searchResults$.asObservable();
    }

    public getDictionariesList(): Promise<any> {
        return new Promise((res) => {
            res(DICTIONARIES);
        });
    }

    public openDictionary(dictionaryId: string): Promise<EosDictionary> {
        const _dictionary = this._dictionaries.get(dictionaryId);

        if (_dictionary) {
            this._mDictionaryPromise.delete(dictionaryId);
            return new Promise<EosDictionary>((res) => res(_dictionary));
        } else {
            return this._openDictionary(dictionaryId);
        }

    }

    private _openDictionary(dictionaryId: string): Promise<EosDictionary> {
        let _p = this._mDictionaryPromise.get(dictionaryId);
        if (!_p) {
            _p = <Promise<EosDictionary>>this._api.getDictionaryDescriptorData(dictionaryId)
                .then((descData: any) => {
                    this._dictionary = new EosDictionary(descData);
                    this._dictionaries.set(dictionaryId, this._dictionary);
                    return this._api.getNodes(this._dictionary.descriptor);
                })
                .then((data: any[]) => {
                    this._dictionary.init(data);
                    this._dictionary$.next(this._dictionary);
                    this._mDictionaryPromise.delete(dictionaryId);
                    return this._dictionary;
                })
                .catch((err) => {
                    this._mDictionaryPromise.delete(dictionaryId);
                    Promise.reject(err);
                });
            this._mDictionaryPromise.set(dictionaryId, _p);
        }
        return _p;
    }

    public getNode(dictionaryId: string, nodeId: string): Promise<EosDictionaryNode> {
        return <Promise<EosDictionaryNode>>this.openDictionary(dictionaryId)
            .then((_dict) => {
                if (_dict) {
                    let _node = _dict.getNode(nodeId);
                    if (_node) {
                        return _node;
                    } else {
                        return this._api.getNode(this._dictionary.descriptor, nodeId)
                            .then((data: any) => {
                                _node = null;
                                if (data) {
                                    _node = new EosDictionaryNode(_dict.descriptor.record, data);
                                    _dict.addNode(_node, _node.parent.id);
                                }
                                return _node;
                            });
                    }
                }
            });
    }

    public selectNode(dictionaryId: string, nodeId: string): Promise<EosDictionaryNode> {
        return new Promise((res, rej) => {
            if (!nodeId) {
                this._selectedNode = this._dictionary.root;
                this._selectedNode$.next(this._selectedNode);
                this._openedNode = this._dictionary.root;
                this._openedNode$.next(this._openedNode);
                res(null);
            }
            return this.getNode(dictionaryId, nodeId)
                .then((node) => {
                    if (this._selectedNode !== node) {
                        if (node) {
                            // expand all parents of selected node
                            let parent = node.parent;
                            while (parent) {
                                parent.isExpanded = true;
                                parent = parent.parent;
                            }
                        }
                        /* console.log('selectNode', node); */
                        this._selectedNode = node;
                        this._selectedNode$.next(node);
                        this._openedNode = null;
                        this._openedNode$.next(null);
                    }
                    return node;
                });
        });
    }

    public isRoot(nodeId: string): boolean {
        return this._dictionary.root.id === nodeId;
    }

    public openNode(dictionaryId: string, nodeId: string): Promise<EosDictionaryNode> {
        return new Promise((res, rej) => {
            this.getNode(dictionaryId, nodeId)
                .then((node) => {
                    if (this._openedNode !== node) {
                        this._openedNode = node;
                        this._openedNode$.next(node);
                    }
                    res(node);
                })
                .catch((err) => rej(err));
        });
    }

    public getChildren(dictionaryId: string, nodeId: string): Promise<EosDictionaryNode[]> {
        return new Promise((res, rej) => { // tslint:disable-line:no-unused-variable
            this.getNode(dictionaryId, nodeId)
                .then((_node) => {
                    rej('not implemented (may be useless???)');
                })
                .catch((err) => rej(err));
        });
    }

    public getEmptyNode() { // Param of perent is needed
        const newNode = new EosDictionaryNode(this._dictionary.descriptor.record, {}, '000' + this._dictionary.nodes.size);
        // here we must generate id and assign some other parameters
        newNode._descriptor = this._dictionary.descriptor.record;
        // newNode.parent = this._selectedNode;
        // newNode.parentId = this._selectedNode.id;
        // here we must add newNode to nodesList
        // and refresh all list too (not sure)
        // this._selectedNode$.next(this._selectedNode);
        this.addChild(newNode);
        return newNode;
    }

    /* public updateNode(dictionaryId: string, nodeId: string, value: EosDictionaryNode): Promise<any>
    { // tslint:disable-line:no-unused-variable max-line-length
        return new Promise((res, rej) => { // tslint:disable-line:no-unused-variable
            this.getNode(dictionaryId, nodeId)
                .then((node) => {
                    Object.assign(node, value);
                    this._selectedNode$.next(this._selectedNode);
                    res(node);
                }).catch(
                (err) => rej(err)
                );
            // rej('not implemented');
        });
    }*/

    public updateNode(dictionaryId: string, nodeId: string, descriptor: RecordDescriptor, data: any): Promise<any> { // tslint:disable-line:no-unused-variable max-line-length
        // console.log('updateNode not implemented');
        return new Promise((res, rej) => { // tslint:disable-line:no-unused-variable
            this.getNode(dictionaryId, nodeId)
                .then((node) => {
                    Object.assign(node.data, data);
                    this._selectedNode$.next(this._selectedNode);
                    res(node);
                }).catch(
                (err) => rej(err)
                );
            // rej('not implemented');
        });
    }

    private _deleteNode(node: EosDictionaryNode): void {
        if (this._openedNode === node) {
            this._openedNode = null;
            this._openedNode$.next(this._openedNode);
        }
        Object.assign(node, { ...node, isDeleted: true });
        if (node.children) {
            node.children.forEach((subNode) => this._deleteNode(subNode));
        }
    }

    public deleteSelectedNodes(dictionaryId: string, nodes: string[]): void {
        nodes.forEach((nodeId) => {
            this.getNode(dictionaryId, nodeId)
                .then((node) => this._deleteNode(node));
        });
        this._dictionary$.next(this._dictionary);
        /* fake */
    }

    public addChild(node: EosDictionaryNode) {
        if (this._selectedNode) {
            this._dictionary.addNode(node, this._selectedNode.id);
        } else {
            this._dictionary.addNode(node);
        }
        this._selectedNode$.next(this._selectedNode);
        this._dictionary$.next(this._dictionary);
    }

    public physicallyDelete(nodeId: string): boolean {
        const _result = this._dictionary.deleteNode(nodeId, true);
        this._dictionary$.next(this._dictionary);
        this._selectedNode$.next(this._selectedNode);
        return _result;
    }

    public search(searchString: string, globalSearch: boolean) {
        this._searchString = searchString;
        if (searchString.length) {
            this._searchResults = this._dictionary.search(searchString, globalSearch, this._selectedNode);
            if (!this._searchResults.length) {
                this._msgSrv.addNewMessage(WARN_SEARCH_NOTFOUND);
            }
        } else {
            this._searchResults = [];
        }
        this._searchResults$.next(this._searchResults);
    }

    public fullSearch(queries: IFieldView[], searchInDeleted: boolean) {
        this._searchResults = this._dictionary.fullSearch(queries, searchInDeleted);
        this._searchResults$.next(this._searchResults);
    }

    public restoreItem(node: EosDictionaryNode) {
        Object.assign(node, { ...node, isDeleted: false });
        Object.assign(node, { ...node, selected: false });
        if (node.children) {
            node.children.forEach((subNode) => this.restoreItem(subNode));
        }
    }
}
