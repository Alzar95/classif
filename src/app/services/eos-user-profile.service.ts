import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { Router } from '@angular/router';

import { AuthService } from '../../eos-rest/services/auth.service';
import { AUTH_REQUIRED, SESSION_CLOSED } from '../consts/messages.consts';
import { EosMessageService } from '../../eos-common/services/eos-message.service';
import { IUserProfile } from '../core/user-profile.interface';
import { DEFAURT_USER, USER_SETTINGS } from '../consts/user.consts';
import { ISettingsItem } from '../core/settings-item.interface';
import { USER_CL, SYS_PARMS } from '../../eos-rest/interfaces/structures';

@Injectable()
export class EosUserProfileService implements IUserProfile {
    name: string;
    secondName: string;
    family: string;
    photoUrl?: string;
    settings: ISettingsItem[];
    private _user: USER_CL;
    private _params: SYS_PARMS;

    private _isAuthorized: boolean;

    private _settings$: BehaviorSubject<ISettingsItem[]>;
    private _authorized$: BehaviorSubject<boolean>;
    private _authPromise: Promise<boolean>;

    get shortName(): string {
        if (this._user) {
            return this._user.SURNAME_PATRON;
        } else {
            return null;
        }
    }

    get settings$(): Observable<ISettingsItem[]> {
        return this._settings$.asObservable();
    }

    get authorized$(): Observable<boolean> {
        return this._authorized$.asObservable();
    }

    isAuthorized(silent = false): boolean {
        if (!silent && !this._isAuthorized) {
            this._msgSrv.addNewMessage(AUTH_REQUIRED);
            // this._authorized$.next(this._isAuthorized);
        }
        return this._isAuthorized;
    }

    constructor(
        private _router: Router,
        private _authSrv: AuthService,
        private _msgSrv: EosMessageService
    ) {
        Object.assign(this, DEFAURT_USER);
        this.settings = USER_SETTINGS;
        this._isAuthorized = false;
        this._settings$ = new BehaviorSubject<ISettingsItem[]>(this.settings);
        this._authorized$ = new BehaviorSubject<boolean>(this._isAuthorized);
    }

    checkAuth(): Promise<boolean> {
        if (this._isAuthorized) {
            return new Promise((resp) => resp(true));
        } else {
            this._authPromise = this._authSrv.getContext()
                .then((context) => {
                    this._authPromise = null;
                    this._setUser(context.user, context.sysParams);
                    return this._setAuth(true);
                })
                .catch((err) => {
                    this._authPromise = null;
                    return this._setAuth(false);
                });
            return this._authPromise;
        }
    }

    notAuthorized() {
        /* console.log('notAuthorized fired'); */
        if (this._isAuthorized) {
            this._isAuthorized = false;
            this._msgSrv.addNewMessage(AUTH_REQUIRED);
            this._authorized$.next(false);
        }
    }

    private _setUser(user: USER_CL, params: SYS_PARMS) {
        // console.log('_setUser', user, params);
        this._user = user;
        this._params = params;
    }

    private _setAuth(auth: boolean): boolean {
        if (this._isAuthorized !== auth) {
            this._isAuthorized = auth;
            this._authorized$.next(auth);
        }
        return auth;
    }

    login(name: string, password: string): Promise<any> {
        return this._authSrv.login(name, password).then((context) => {
            // todo: fill user profile from response
            this._setUser(context.user, context.sysParams);
            return this._setAuth(true);
        });
    }

    logout(): Promise<any> {
        return this._authSrv.logout().then((resp) => {
            this._setAuth(false);
            this._msgSrv.addNewMessage(SESSION_CLOSED);
            this._router.navigate(['/login']);
            return resp;
        });
    }

    setSetting(key: string, value: any) {
        this._setSetting(key, value);
        this._settings$.next(this.settings);
        this._settings$.next(this.settings);
    }

    saveSettings(settings: any[]) {
        settings.forEach((item) => this._setSetting(item.id, item.value));
        this._settings$.next(this.settings);
        this._settings$.next(this.settings);
    }

    private _setSetting(key: string, value: any) {
        let _setting = this.settings.find((item) => item.id === key);
        if (!_setting) {
            _setting = {
                id: key,
                name: key,
                value: value
            }
        } else {
            _setting.value = value;
        }
    }
}
