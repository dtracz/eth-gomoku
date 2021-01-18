import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {TransferComponent} from './components/transfer/transfer.component';
import {HomeComponent} from './components/main/home/home.component';
import {HeaderComponent} from './components/header/header.component';
import {FooterComponent} from './components/footer/footer.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatNativeDateModule} from "@angular/material/core";
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {GameComponent} from './components/main/game/game.component';
import {JoinComponent} from './components/main/join/join.component';
import {StartComponent} from './components/main/start/start.component';
import {MatToolbarModule} from "@angular/material/toolbar";
import { AccountInfoComponent } from './components/account-info/account-info.component';

@NgModule({
  declarations: [
    AppComponent,
    TransferComponent,
    HomeComponent,
    HeaderComponent,
    FooterComponent,
    GameComponent,
    JoinComponent,
    StartComponent,
    AccountInfoComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatCheckboxModule,
    MatNativeDateModule,
    FormsModule,
    ReactiveFormsModule,
    MatToolbarModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
