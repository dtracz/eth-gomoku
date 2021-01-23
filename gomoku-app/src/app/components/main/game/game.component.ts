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
  // move as typescript tuple [x,y]
  private currentMove: [number, number];

  constructor(public gameService: GameEthereumService) {
    this.fieldStates = new Array(GOMOKU_SIZE);
    for (let i = 0; i < GOMOKU_SIZE; i++) {
      this.fieldStates[i] = new Array(GOMOKU_SIZE).fill(0);
    }
  }

  ngOnInit(): void {
  }

  setColour(i, j) {
    // revert previous move if exists
    if (!!this.currentMove)
      this.fieldStates[this.currentMove[0]][this.currentMove[1]] = FieldState.Free;
    this.fieldStates[i][j] = this.gameService.playerColour;
    // todo: remove in final version
    console.log(`Index[${i}][${j}] update`)
    console.log(this.fieldStates);
    this.currentMove = [i, j];
  }

  sendMove() {
    // send move with the service, I'm not sure if we should store moveIndex here or in service, if here we could possibly show it in html component
    this.gameService.sendMove(this.currentMove);
  }
}
