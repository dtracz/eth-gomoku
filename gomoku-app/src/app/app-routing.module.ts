import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Routes, RouterModule} from '@angular/router';
import {HomeComponent} from "./components/main/home/home.component";
import {TransferComponent} from "./components/transfer/transfer.component";
import {JoinComponent} from "./components/main/join/join.component";
import {StartComponent} from "./components/main/start/start.component";
import {GameComponent} from "./components/main/game/game.component";

const routes: Routes = [
  {path: '', redirectTo: '/home', pathMatch: 'full'},
  {path: 'home', component: HomeComponent},
  {path: 'join', component: JoinComponent},
  {path: 'start', component: StartComponent},
  {path: 'transfer', component: TransferComponent},
  {path: 'game', component: GameComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes), CommonModule],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
