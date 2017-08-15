import { Component, TemplateRef } from '@angular/core';
import { Router } from '@angular/router';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal/modal-options.class';

import { EosDictService } from '../services/eos-dict.service';
import { EosMessageService } from '../services/eos-message.service';
import { EosUserSettingsService } from '../services/eos-user-settings.service';
import { EosDictionaryNode } from '../core/eos-dictionary-node';
import { EosDictionary } from '../core/eos-dictionary';

@Component({
    selector: 'eos-selected-node',
    templateUrl: 'selected-node.component.html',
})
export class SelectedNodeComponent {

    selectedNode: EosDictionaryNode;
    openedNode: EosDictionaryNode;
    childrenListPerPage: EosDictionaryNode[];

    dictionary: EosDictionary;

    checkAll = false;

    totalItems: number;
    itemsPerPage: number = 10;

    currentPage = 1;
    pageAtList = 1;

    private _dictionaryId: string;

    modalRef: BsModalRef;

    newNode = new EosDictionaryNode({
        id: null,
        code: null,
        title: null,
        parentId: null,
        parent: null,
        children: [],
        description: null,
        isNode: null,
        hasSubnodes: null,
        isExpanded: null,
        isDeleted: false,
        selected: false,
        data: null,
    });

    showDeleted: boolean;

    constructor(private _eosDictService: EosDictService,
        private _eosMessageService: EosMessageService,
        private router: Router,
        private modalService: BsModalService,
        private _eosUserSettingsService: EosUserSettingsService) {
        this._eosDictService.dictionary$.subscribe(
            (dictionary) => {
                this.dictionary = dictionary;
                if (dictionary) {
                    this._dictionaryId = dictionary.id;
                }
            },
            (error) => alert(error)
        );
        this._eosDictService.selectedNode$.subscribe(
            (node) => {
                this.selectedNode = node;
                if (node) {
                    // Uncheck all checboxes before changing selectedNode
                    // if (this.selectedNode) {
                        // this.checkAllItems(false); //No! When go from edit checked elements stay unchecked
                    // }
                    this.openFullInfo(node);
                    if (node.children) {
                        this.totalItems = node.children.length;
                        this.childrenListPerPage = node.children.slice(0, this.itemsPerPage);
                    }
                } else {
                    if (this.dictionary) {
                        this.selectedNode = this.dictionary.root;
                    }
                }
            },
            (error) => alert(error)
        );
        this._eosDictService.openedNode$.subscribe(
            (node) => {
                this.openedNode = node;
                if (!this.openedNode && this.dictionary) {
                    this.openedNode = this.dictionary.root;
                }
            },
            (error) => alert(error)
        );

        this._eosUserSettingsService.settings.subscribe((res) => {
            this.showDeleted = res.find((s) => s.id === 'showDeleted').value;
        });
    }

    openFullInfo(child: EosDictionaryNode): void {
        if (!child.isDeleted) {
                if (child.id !== '') {
                this._eosDictService.openNode(this._dictionaryId, child.id);
            }
        }
    }

    selectNode(nodeId: string): void {
        this.checkAllItems(false);
        this.router.navigate(['spravochniki', this._dictionaryId, nodeId]);
    }

    /*editNode() {
        this.router.navigate([
            'spravochniki',
            this._dictionaryId,
            this.openedNode ? this.openedNode.id : this.selectedNode.id,
            'edit',
        ]);
    }*/

    editNode(node?: EosDictionaryNode) {
        let nodeId: string;
        if (node) {
            if (!node.isDeleted) {
                nodeId = node.id;
            }
        } else {
            if (this.openedNode) {
                if(!this.openedNode.isDeleted) {
                    nodeId = this.openedNode.id;
                } else {
                    nodeId = this.selectedNode.id;
                }
            }
        }

        this.router.navigate([
            'spravochniki',
            this._dictionaryId,
            nodeId,
            'edit',
        ]);
    }

    checkAllItems(value: boolean = !this.checkAll): void {
        this.checkAll = value;
        this.selectedNode.selected = this.checkAll;
        if (this.selectedNode.children) {
            for (const item of this.selectedNode.children) {
                item.selected = this.checkAll;
            }
        }
    }

    checkItem(item: EosDictionaryNode): void {
        item.selected = !item.selected;
        this.checkAll = false;
    }

    deleteSelectedItems(): void {
        if (this.openedNode.selected && this.openedNode !== this.selectedNode) {
            this.openFullInfo(this.openedNode.parent);
        }
        if (this.selectedNode.selected) {
            this._eosDictService.deleteSelectedNodes(this._dictionaryId, [this.selectedNode.id]);
            if (this.selectedNode.parent) {
                this.selectNode(this.selectedNode.parent.id);
            } else {
                this.selectNode('');
            }
           return;
        }
        const selectedNodes: string[] = [];
        this.selectedNode.children.forEach((child) => {
            if (child.selected && !child.isDeleted) {
                selectedNodes.push(child.id);
            }
        });
        if (!selectedNodes.length ) {
            this._eosMessageService.addNewMessage({
                type: 'warning',
                title: 'Ошибка удаления: ',
                msg: 'не выбраны элементы для удаления',
            });
        }
        this._eosDictService.deleteSelectedNodes(this._dictionaryId, selectedNodes);
        this.checkAllItems(false);
    }

    createItem() {
        this.modalRef.hide();
        this._eosDictService.addChild(this.newNode);
        this.newNode = new EosDictionaryNode({
            id: null,
            code: null,
            title: null,
            parentId: null,
            parent: null,
            children: [],
            description: null,
            isNode: null,
            hasSubnodes: null,
            isExpanded: null,
            isDeleted: false,
            selected: false,
            data: null,
        });
    }

    openCreatingForm(template: TemplateRef<any>) {
        this.modalRef = this.modalService.show(template);
        this.newNode.parentId = this.selectedNode.id;
        this.newNode.parent = this.selectedNode;
    }

    nextItem(goBack: boolean): void {
        if (this.selectedNode.id !== this.openedNode.id) {
            let i = 0;
            for (const child of this.selectedNode.children) {
                if (child.id === this.openedNode.id) {
                    break;
                }
                i++;
            }
            if (goBack) {
                this._eosDictService.openNode(this._dictionaryId, this.selectedNode.children[(i - 1 +
                    this.selectedNode.children.length) % this.selectedNode.children.length].id);
                this.currentPage = Math.floor(((i - 1 + this.selectedNode.children.length) % this.selectedNode.children.length) / (this.itemsPerPage)) + 1;
            } else {
                this._eosDictService.openNode(this._dictionaryId, this.selectedNode.children[(i + 1 +
                    this.selectedNode.children.length) % this.selectedNode.children.length].id);
                this.currentPage = Math.floor(((i + 1 + this.selectedNode.children.length) % this.selectedNode.children.length) / (this.itemsPerPage)) + 1;
            }
        }
    }

    pageChanged(event: any): void {
        this.pageAtList = 1;
        this.childrenListPerPage = this.selectedNode.children.slice((event.page-1)*event.itemsPerPage, event.page*event.itemsPerPage);
    }

    setItemCount(value: string) {
        this.itemsPerPage = +value;
        this.childrenListPerPage = this.selectedNode.children.slice((this.currentPage-1)*+value, this.currentPage*+value);
    }

    showMore() {
        this.pageAtList++;
        this.childrenListPerPage = this.selectedNode.children.slice((this.currentPage-1)*this.itemsPerPage, this.currentPage*this.itemsPerPage*this.pageAtList);
    }

    switchShowDeleted(value: boolean) {
        this._eosUserSettingsService.saveShowDeleted(value);
    }

    physicallyDelete() {
    }

    restoringLogicallyDeletedItem() {
        if (this.selectedNode.selected && this.selectedNode.isDeleted) {
            this.selectedNode.isDeleted = false;
            this.selectedNode.selected = false;
        }

        this.selectedNode.children.forEach(child => {
            if (child.selected && child.isDeleted) {
                this._restoringLogicallyDeletedItem(child);
            }
        });
    }

    private _restoringLogicallyDeletedItem(node: EosDictionaryNode) {
        if (node.isDeleted) {
            node.isDeleted = false;
            node.selected = false;
        }

        if (node.children) {
            node.children.forEach(child => {
                if (child.isDeleted) {
                    this._restoringLogicallyDeletedItem(child);
                }
            });
        }
    }
}
