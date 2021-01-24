import {Injectable} from '@angular/core';
import {GameEthereumService} from './game-ethereum.service';
import {FieldState} from '../utils/field-state';

const GOMOKU_SIZE = 19;

@Injectable({
  providedIn: 'root'
})
export class GameService {

  private readonly channel: BroadcastChannel;
  private currentMove: [number, number];
  readonly fieldStates: FieldState[][];

  moveIdx: number;
  playerColour: FieldState;
  playerName: string;
  gameAddress: string;

  turn = false;
  gameInit = false;

  constructor(private gameEthereumService: GameEthereumService) {

    this.fieldStates = new Array(GOMOKU_SIZE);
    for (let i = 0; i < GOMOKU_SIZE; i++) {
      this.fieldStates[i] = new Array(GOMOKU_SIZE).fill(FieldState.Free);
    }

    this.channel = new BroadcastChannel('gomoku');
    this.initChannelListeners();
  }

  private initChannelListeners(): void {
    this.channel.addEventListener('message', event => {
      const field = this.fieldStates[event.data[0]][event.data[1]];
      if (field === FieldState.Free) {
        if (this.playerColour === FieldState.White) {
          this.fieldStates[event.data[0]][event.data[1]] = FieldState.Black;
        } else {
          this.fieldStates[event.data[0]][event.data[1]] = FieldState.White;
        }
        this.turn = !this.turn;
        this.moveIdx += 2;
      }
    });
  }

  setColour(i: number, j: number): void {
    if (!!this.currentMove) {
      this.fieldStates[this.currentMove[0]][this.currentMove[1]] = FieldState.Free;
    }
    this.fieldStates[i][j] = this.playerColour;
    this.currentMove = [i, j];
  }

  sendMove(): void {
    this.turn = !this.turn;
    this.fieldStates[this.currentMove[0]][this.currentMove[1]] = this.playerColour;
    this.channel.postMessage(this.currentMove);
    this.currentMove = undefined;
  }

  proposeDraw(): void {
    this.channel.postMessage('');
  }

  sendMovesToChain(): void {

  }
}
