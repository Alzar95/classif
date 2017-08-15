import { Component, Input, TemplateRef, Output, EventEmitter } from '@angular/core';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal/modal-options.class';
import { Router } from '@angular/router';

import { EosDictService } from '../services/eos-dict.service';
import { EosDictionaryNode } from '../core/eos-dictionary-node';
import { EosUserSettingsService } from '../services/eos-user-settings.service';
import { EosMessageService } from '../services/eos-message.service';
import { NodeListActionsService } from '../selected-node/node-list-action.service';

@Component({
    selector: 'eos-node-list',
    templateUrl: 'node-list.component.html',
})
export class NodeListComponent {
    @Input() nodes: EosDictionaryNode[];

    modalRef: BsModalRef;
    private _dictionaryId: string;

    openedNode: EosDictionaryNode;
    nodeListPerPage: EosDictionaryNode[];

    totalItems: number;
    itemsPerPage = 10;

    currentPage = 1;
    pageAtList = 1;
    showDeleted: boolean;

    hasParent = true;

    constructor(private _dictionaryService: EosDictService,
        private _userSettingsService: EosUserSettingsService,
        private _messageService: EosMessageService,
        private modalService: BsModalService,
        private router: Router,
        private _actionService: NodeListActionsService) {
            this._dictionaryService.openedNode$.subscribe((node) => {
                this.openedNode = node;
            });

            this._dictionaryService.dictionary$.subscribe(
                (dictionary) => {
                    if (dictionary) {
                        this._dictionaryId = dictionary.id;
                    }
                },
                (error) => alert(error)
            );
            this._dictionaryService.selectedNode$.subscribe((node) => {
                if (node) {
                    this._update(node.children, true);
                }
            });
            this._dictionaryService.searchResults$.subscribe((nodes) => {
                if (nodes.length) {
                    this._update(nodes, false);
                }
            });

            this._userSettingsService.settings.subscribe((res) => {
                this.showDeleted = res.find((s) => s.id === 'showDeleted').value;
            });

            this._actionService.delete$.subscribe((res) => {
                if (res) {
                    this.deleteSelectedItems();
                }
            });

            this._actionService.edit$.subscribe((res) => {
                if (res && this.openedNode) {
                    this.editNode(this.openedNode);
                }
            });

            this._actionService.nextItem$.subscribe((res) => {
                if (res !== null) {
                    this.nextItem(res);
                }
            });

            this._actionService.physicallyDelete$.subscribe((res) => {
                if (res) {
                    this.physicallyDelete();
                }
            });

            this._actionService.restore$.subscribe((res) => {
                if (res) {
                    this.restoringLogicallyDeletedItem();
                }
            });

            this._actionService.checkAll$.subscribe((res) => {
                if (res !== null) {
                    this.checkAllItems(res);
                }
            });
    }

    private _update(nodes: EosDictionaryNode[], hasParent: boolean) {
        this.nodes = nodes;
        this.hasParent = hasParent;
        this.totalItems = nodes.length;
            if (nodes.length) {
                    this.nodeListPerPage = this.nodes.slice(0, this.itemsPerPage);
                    if (!this.hasParent) {
                        this._dictionaryService.openNode(this._dictionaryId, this.nodes[0].id);
                    }
                }

    }

    checkAllItems(value: boolean): void {
        if (this.nodes) {
            for (const item of this.nodes) {
                item.selected = !value;
            }
        }
    }

    openFullInfo(node: EosDictionaryNode): void {
        if (!node.isDeleted) {
            if (node.id !== '') {
                this._dictionaryService.openNode(this._dictionaryId, node.id);
            }
        }
    }

    editNode(node: EosDictionaryNode) {
        if (node) {
            if (!node.isDeleted) {
                this.router.navigate([
                    'spravochniki',
                    this._dictionaryId,
                    node.id,
                    'edit',
                ]);
            }
        } else {
            this._messageService.addNewMessage({
                type: 'warning',
                title: 'Ошибка редактирования: ',
                msg: 'не выбран элемент для редактирования'
            });
        }
    }

    deleteSelectedItems(): void {
        const selectedNodes: string[] = [];
        if (this.nodes) {
                this.nodes.forEach((child) => {
                if (child.selected && !child.isDeleted) {
                    selectedNodes.push(child.id);
                }
            });
        }
        this._dictionaryService.deleteSelectedNodes(this._dictionaryId, selectedNodes);
        this.checkAllItems(false);
    }

    nextItem(goBack: boolean): void {
        let i = 0;
        for (const node of this.nodes) {
            if (node.id === this.openedNode.id) {
                break;
            }
            i++;
        }
        if (i < this.nodes.length) {
            if (goBack) {
                this._dictionaryService.openNode(this._dictionaryId, this.nodes[(i - 1 +
                    this.nodes.length) % this.nodes.length].id);
                this.currentPage = Math.floor(((i - 1 + this.nodes.length)
                    % this.nodes.length) / (this.itemsPerPage)) + 1;
            } else {
                this._dictionaryService.openNode(this._dictionaryId, this.nodes[(i + 1 +
                    this.nodes.length) % this.nodes.length].id);
                this.currentPage = Math.floor(((i + 1 + this.nodes.length)
                    % this.nodes.length) / (this.itemsPerPage)) + 1;
            }
        }
    }

    physicallyDelete() {
        if (this.nodes) {
            this.nodes.forEach(node => {
                if (node.selected) {
                    if (node.title.length % 3) { // here must be API request for check if possible to delete
                        this._messageService.addNewMessage({
                            type: 'danger',
                            title: 'Ошибка удаления элемента: ',
                            msg: 'на этот объект (' + node.title + ') ссылаются другие объекты системы',
                        });
                    } else {
                        this._dictionaryService.physicallyDelete(node.id);
                    }
                }
            });
        }
    }

    restoringLogicallyDeletedItem() {
        if (this.nodes) {
            this.nodes.forEach(child => {
                if (child.selected && child.isDeleted) {
                    this._dictionaryService.restoreItem(child);
                }
            });
        }
    }

    pageChanged(event: any): void {
        console.log('2', this.itemsPerPage, event.itemsPerPage);
        this.pageAtList = 1;
        this.nodeListPerPage = this.nodes.slice((event.page - 1)
            * event.itemsPerPage, event.page * event.itemsPerPage);
            console.log((event.page - 1)
            * event.itemsPerPage, event.page * event.itemsPerPage);
    }

    showMore() {
        this.pageAtList++;
        this.nodeListPerPage = this.nodes.slice((this.currentPage - 1)
            * this.itemsPerPage, this.currentPage * this.itemsPerPage * this.pageAtList);
    }

    setItemCount(value: string) {
        this.itemsPerPage = +value;
        this.nodeListPerPage = this.nodes.slice((this.currentPage - 1) * +value, this.currentPage * +value);
    }
}