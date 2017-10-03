import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';

import { EosUserProfileService } from '../../app/services/eos-user-profile.service';
import { EosDictService } from '../services/eos-dict.service';
import { EosDictionaryNode } from '../core/eos-dictionary-node';
import {
    DictionaryActionService,
    DICTIONARY_ACTIONS,
    DICTIONARY_STATES
} from '../dictionary/dictionary-action.service';

@Component({
    selector: 'eos-dictionary',
    templateUrl: 'dictionary.component.html',
})
export class DictionaryComponent implements OnDestroy {
    private _dictionaryId: string;
    private _nodeId: string;

    nodes: EosDictionaryNode[];
    // hideTree = true;
    // hideFullInfo = true;
    dictionaryName: string;

    currentState: number;
    readonly states = DICTIONARY_STATES;

    private _actionSubscription: Subscription;
    private _dictionarySubscription: Subscription;

    constructor(
        private _dictSrv: EosDictService,
        private _route: ActivatedRoute,
        private _actSrv: DictionaryActionService,
        private _profileSrv: EosUserProfileService
    ) {
        _profileSrv.authorized$.subscribe((auth) => {
            if (auth) {
                this._update();
            }
        });

        this._route.params.subscribe((params) => {
            if (params) {
                this._dictionaryId = params.dictionaryId;
                this._nodeId = params.nodeId;
                this._update();
            }
        });

        this.nodes = [];

        this._dictionarySubscription = this._dictSrv.dictionary$.subscribe((dictionary) => {
            if (dictionary) {
                this._dictionaryId = dictionary.id;
                if (dictionary.root) {
                    this.dictionaryName = dictionary.root.title;
                }
                this.nodes = [dictionary.root];
            }
        });

        this._actionSubscription = this._actSrv.action$.subscribe((action) => {
            this._swichCurrentState(action);
        });

        this. currentState = this._actSrv.state;

    }

    private _swichCurrentState(action: DICTIONARY_ACTIONS) {
        switch (action) {
            // TODO: try to find more simple solition
            case DICTIONARY_ACTIONS.closeTree:
                switch (this.currentState) {
                    case DICTIONARY_STATES.full:
                        this.currentState = DICTIONARY_STATES.info;
                        break;
                    case DICTIONARY_STATES.tree:
                        this.currentState = DICTIONARY_STATES.selected;
                        break;
                }
                break;
            case DICTIONARY_ACTIONS.openTree:
                switch (this.currentState) {
                    case DICTIONARY_STATES.info:
                        this.currentState = DICTIONARY_STATES.full;
                        break;
                    case DICTIONARY_STATES.selected:
                        this.currentState = DICTIONARY_STATES.tree;
                        break;
                }
                break;
            case DICTIONARY_ACTIONS.closeInfo:
                switch (this.currentState) {
                    case DICTIONARY_STATES.full:
                        this.currentState = DICTIONARY_STATES.tree;
                        break;
                    case DICTIONARY_STATES.info:
                        this.currentState = DICTIONARY_STATES.selected;
                        break;
                }
                break;
            case DICTIONARY_ACTIONS.openInfo:
                switch (this.currentState) {
                    case DICTIONARY_STATES.tree:
                        this.currentState = DICTIONARY_STATES.full;
                        break;
                    case DICTIONARY_STATES.selected:
                        this.currentState = DICTIONARY_STATES.info;
                        break;
                }
                break;
        }
    }

    private _update() {
        if (this._dictionaryId) {
            this._dictSrv.openDictionary(this._dictionaryId)
                .then(() => {
                    if (this._nodeId) {
                        this._dictSrv.selectNode(this._dictionaryId, this._nodeId);
                    }
                });
        }
    }

    ngOnDestroy() {
        this._actSrv.emitAction(null);
        this._actSrv.state = this.currentState;
        this._dictionarySubscription.unsubscribe();
        this._actionSubscription.unsubscribe();

    }
}