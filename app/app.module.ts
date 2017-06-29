import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { LocationStrategy, HashLocationStrategy } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { BreadcrumbsComponent } from './breadcrumb/breadcrumb.component';
import { DictionaryComponent} from './dictionary/dictionary.component';
import { DictionariesComponent } from './dictionaries/dictionaries.component';
import { HomeComponent } from './home/home.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { EditComponent } from './edit/edit.component';

import { EosApiService } from './services/eos-api.service';
import { EosDictService } from './services/eos-dict.service';

@NgModule({
    declarations: [
        AppComponent,
        BreadcrumbsComponent,
        DictionaryComponent,
        DictionariesComponent,
        HomeComponent,
        SidebarComponent,
        EditComponent,
    ],
    imports: [
        BrowserModule,
        FormsModule,
        AppRoutingModule,
        HttpModule,
    ],
    providers: [
        { provide: LocationStrategy, useClass: HashLocationStrategy },
        EosApiService,
        EosDictService,
    ],
    bootstrap: [AppComponent],
})
export class AppModule { }
