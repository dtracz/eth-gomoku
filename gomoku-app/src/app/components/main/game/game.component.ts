import {Component, OnInit} from '@angular/core';
import {GameService} from '../../../services/game.service';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['../common.css', './game.component.css']
})
export class GameComponent implements OnInit {

  constructor(public gameService: GameService) {
  }

  ngOnInit(): void {
  }

  setColour(i: number, j: number): void {
    this.gameService.setColour(i, j);
  }

  sendMove(): void {
    this.gameService.sendMove();
  }

  proposeDraw(): void {
    this.gameService.proposeDraw();
  }

  sendMovesToChain(): void {

  }
}
