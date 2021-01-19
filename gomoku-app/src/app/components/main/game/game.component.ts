import {Component, OnInit} from '@angular/core';
import {FieldState, GameEthereumService} from "../../../services/game.ethereum.service";

const GOMOKU_SIZE = 19;

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['../common.css', './game.component.css']
})
export class GameComponent implements OnInit {

  readonly fieldStates: FieldState[][];
  readonly playerName: string;
  readonly playerColour: FieldState;
  readonly gameAddress: string;

  constructor(private gameService: GameEthereumService) {
    this.playerName = gameService.playerName;
    this.playerColour = gameService.playerColour;
    this.gameAddress = gameService.gameAddress;
    this.fieldStates = new Array(GOMOKU_SIZE);
    for (let i = 0; i < GOMOKU_SIZE; i++) {
      this.fieldStates[i] = new Array(GOMOKU_SIZE).fill(0);
    }
  }

  ngOnInit(): void {
  }

  setColour(i, j) {
    this.fieldStates[i][j] = this.gameService.playerColour;
    console.log(`Index[${i}][${j}] update`)
    console.log(this.fieldStates);
  }

  sendMove(i, j) {
    this.gameService.sendMove(i, j);
  }
}
