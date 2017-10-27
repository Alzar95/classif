﻿import { Injectable, Optional } from '@angular/core';
import { Http, Headers, Response, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { ApiCfg } from '../core/api-cfg';
import { ALL_ROWS, HTTP_OPTIONS, BATCH_BOUNDARY, CHANGESET_BOUNDARY } from '../core/consts';
import { IAsk, IKeyValuePair, IR, IRequest } from '../interfaces/interfaces';
import { SequenceMap } from '../core/sequence-map';
import { Metadata } from '../core/metadata';
import { EntityHelper } from '../core/entity-helper';
import { ErrorService } from './error.service';
import { PipeUtils } from '../core/pipe-utils';
import { Cache } from '../core/cache';

@Injectable()
export class PipRX extends PipeUtils {
    private _cfg: ApiCfg;
    private _options = HTTP_OPTIONS;

    public sequenceMap: SequenceMap = new SequenceMap();
    // TODO: если сервис, то в конструктор? если хелпер то переимновать?
    public errorService = new ErrorService();
    public entityHelper: EntityHelper;
    public cache: Cache;

    static criteries(cr: any) {
        return { criteries: cr };
    }

    static args(ar: any) {
        return { args: ar };
    }


    static invokeSop(chr, name, args, method = 'POST') {
        const ar = [];
        // tslint:disable-next-line:forin
        for (const k in args) {
            const quot = typeof (args[k]) === 'string' ? '\'' : '';
            ar.push(k + '=' + quot + encodeURIComponent(args[k]) + quot);
        }

        chr.push({
            requestUri: name + '?' + ar.join('&'),
            method: method
        });
    }

    constructor(private http: Http, @Optional() cfg: ApiCfg) {
        super();
        this._cfg = cfg;
        this._metadata = new Metadata(cfg);
        this._metadata.init();
        this.entityHelper = new EntityHelper(this._metadata);
        this.cache = new Cache(this, this._metadata);
    }

    getConfig(): ApiCfg {
        return this._cfg;
    }

    private makeArgs(args: IKeyValuePair): string {
        let url = '';
        // tslint:disable-next-line:forin
        for (const argname in args) {
            let q = '',
                v = args[argname];
            const t = typeof (args[argname]);
            if (t !== 'number') {
                q = '\'';
                v = t !== 'string' ? encodeURIComponent(JSON.stringify(v)) : v;
            }
            url += ['&', argname, '=', q, v, q].join('');
        };
        return url;
    }

    private _makeUrls(r: IR, ask: IAsk, ids: any) {
        if (r.url) {
            return [r.url];
        }
        const result = [];
        let url = r.urlParams || '';
        if (r.expand) {
            const exp = r.expand.split(',');
            if (exp.length > 10) {
                r._moreJSON.expand = exp.splice(10, exp.length - 10).join(',');
            }
            url += '&$expand=' + exp.join(',');
        }

        if (ask.criteries) {
            // проблема с кириллицей, поэтому escape
            url += '&criteries=' + encodeURIComponent(JSON.stringify(ask.criteries));
        }

        if (ask.args) {
            url += this.makeArgs(ask.args);
        }

        if (r.foredit) {
            url += '&ForEdit=true';
        }

        if (r.top) {
            url += '&$top=' + r.top.toString();
        }

        if (r.skip) {
            url += '&$skip=' + r.skip.toString();
        }

        if (r.orderby) {
            url += '&$orderby=' + r.orderby;
        }

        if (r._moreJSON) {
            url += '&_more_json=' + JSON.stringify(r._moreJSON);
        }

        if (ids !== undefined) {
            const idss = PipeUtils.chunkIds(PipeUtils.distinctIDS(ids instanceof Array ? ids : [ids]));
            for (let i = 0; i < idss.length; i++) {
                result.push([this._cfg.dataSrv, r._et, '/?ids=', idss[i], url].join(''));
            }
        } else {
            result.push(this._cfg.dataSrv + r._et + url.replace('&', '?'));
        }

        return result;
    }

    private _read<T>(req: IRequest): Observable<T[]> {
        const r = req as IR;
        r._et = Object.keys(req)[0];

        const ask = req[r._et];
        delete req[r._et];
        const a = ask;
        const ids = ((a.criteries === undefined) && (a.args === undefined) && (a !== ALL_ROWS)) ? a : undefined;
        const urls = this._makeUrls(r, a, ids);

        return this._odataGet<T>(urls, req);
    }

    read<T>(req: IRequest): Promise<T[]> {
        return this._read<T>(req).toPromise();
    }

    //
    private _odataGet<T>(urls: string[], req: IRequest): Observable<T[]> {
        const _options = Object.assign({}, this._options, {
            headers: new Headers({
                'MaxDataServiceVersion': '3.0',
                'Accept': 'application/json;odata=light;q=1,application/json;odata=minimalmetadata;'
            })
        });

        const rl = Observable.of(...urls).flatMap(url => {
            return this.http
                .get(url, _options)
                .map((r: Response) => {
                    try {
                        return this.nativeParser(r.json());
                    } catch (e) {
                        return this.errorService.errorHandler({ odataErrors: [e], _request: req, _response: r });
                    }
                })
                /*
                .catch((err, caught) => {
                    this.errorService.errorHandler({ http: err, _request: req });
                    return [];
                })
                */
                ;
        });

        return rl.reduce((acc: T[], v: T[]) => {
            acc.push(...v);
            return acc;
        });
    }

    private _batch(changeSet: any[], vc: string): Observable<any> {
        if (changeSet.length === 0) {
            return Observable.of([]);
        }

        const _options = Object.assign({}, this._options, {
            headers: new Headers({
                // 'DataServiceVersion': '1.0', //todo: add in Allowed-Headers in OPTIONS response
                'Accept': 'multipart/mixed',
                'Content-Type': 'multipart/mixed;boundary=' + BATCH_BOUNDARY,
                'MaxDataServiceVersion': '3.0'
            })
        });

        const d = this.buildBatch(changeSet);
        return this.http
            .post(this._cfg.dataSrv + '$batch?' + vc, d, _options)
            .map((r) => {
                const answer: any[] = [];
                const e = this.parseBatchResponse(r, answer);
                if (e) {
                    return this.errorService.errorHandler({ odataErrors: e });
                }
                return answer;
            }) /*
            .catch((err, caught) => {
                this.errorService.httpCatch(err);
            })*/
            ;
    }

    batch(changeSet: any[], vc: string): Promise<any[]> {
        return this._batch(changeSet, vc).toPromise();
    }

    private buildBatch(changeSets: any[]) {
        let batch = '';
        let i, len;
        batch = ['--' + BATCH_BOUNDARY, 'Content-Type: multipart/mixed; boundary=' + CHANGESET_BOUNDARY, '']
            .join('\r\n');

        for (i = 0, len = changeSets.length; i < len; i++) {
            const it = changeSets[i];
            batch += [
                '', '--' + CHANGESET_BOUNDARY,
                'Content-Type: application/http',
                'Content-Transfer-Encoding: binary',
                '',
                it.method + ' ' + it.requestUri + ' HTTP/1.1',
                'Accept: application/json;odata=light;q=1,application/json;odata=nometadata;',
                'MaxDataServiceVersion: 3.0',
                'Content-Type: application/json',
                'DataServiceVersion: 3.0',
                '',
                it.data ? JSON.stringify(it.data) : ''
            ].join('\r\n');
        }

        batch += ['', '--' + CHANGESET_BOUNDARY + '--', '--' + BATCH_BOUNDARY + '--'].join('\r\n');
        return batch;
    }

    private parseBatchResponse(response: Response, answer: any[]): any[] {
        const dd = response.text().split('--changesetresponse');
        dd.shift();
        dd.pop();
        for (let i = 0; i < dd.length; i++) {
            if (dd[i].indexOf('{') !== -1) {
                dd[i] = dd[i].substr(dd[i].indexOf('{'));
            } else {
                dd[i] = null;
            }
        }
        const allErr = [];
        for (let i = 0; i < dd.length; i++) {
            if (dd[i] !== null) {
                const d = JSON.parse(dd[i]);
                answer.push(d);
                const e = d['odata.error'];
                if (e) { allErr.push(e); }
                console.log(d);
                this.sequenceMap.FixMapItem(d);
            }
        }
        if (allErr.length !== 0) {
            return allErr;
        }
    }
}
