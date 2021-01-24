import {Injectable} from '@angular/core';
import {GameEthereumService} from './game-ethereum.service';
import {FieldColour} from '../utils/field-colour';
import {Move} from '../utils/move';
import {MessageType} from '../utils/message-type';
import {Message} from '../utils/message';

const GOMOKU_SIZE = 19;

@Injectable({
  providedIn: 'root'
})
export class GameService {

  private readonly channel: BroadcastChannel;
  readonly fieldStates: FieldColour[][];
  readonly moves: Move[];

  currentMove: [number, number];
  moveIdx: number;
  playerColour: FieldColour;
  playerName: string;
  gameAddress: string;

  turn = false;
  gameInit = false;
  loaded = false;

  constructor(private gameEthereumService: GameEthereumService) {
    this.moves = [];
    this.fieldStates = new Array(GOMOKU_SIZE);
    for (let i = 0; i < GOMOKU_SIZE; i++) {
      this.fieldStates[i] = new Array(GOMOKU_SIZE).fill(FieldColour.Empty);
    }
    this.channel = new BroadcastChannel('gomoku');
    this.initChannelListeners();
  }

  private initChannelListeners(): void {
    this.channel.addEventListener('message', event => {
      const message = event.data;
      switch (message.type) {
        case MessageType.LOAD: {
          this.loaded = true;
          break;
        }
        case MessageType.MOVE: {
          this.moveMessageHandler(message);
          break;
        }
        case MessageType.DRAW: {
          this.drawMessageHandler(message);
        }
      }
    });
  }

  private moveMessageHandler(message: Message): void {
    const move = message.move;
    const field = this.fieldStates[move[0]][move[1]];
    if (field === FieldColour.Empty) {
      if (this.playerColour === FieldColour.White) {
        this.fieldStates[move[0]][move[1]] = FieldColour.Black;
      } else {
        this.fieldStates[move[0]][move[1]] = FieldColour.White;
      }
      this.turn = !this.turn;
      this.moveIdx += 2;
    }
  }

  private drawMessageHandler(message: Message): void {

  }

  sendLoaded(): void {
    this.channel.postMessage({
      type: MessageType.LOAD
    });
  }

  setColour(i: number, j: number): void {
    if (!!this.currentMove && this.currentMove[0] !== i && this.currentMove[1] !== j && this.fieldStates[i][j] !== FieldColour.Empty) {
      alert('this field is already chosen');
      return;
    }
    if (!!this.currentMove) {
      this.fieldStates[this.currentMove[0]][this.currentMove[1]] = FieldColour.Empty;
    }
    this.fieldStates[i][j] = this.playerColour;
    this.currentMove = [i, j];
  }

  sendMove(): void {
    this.turn = !this.turn;
    this.fieldStates[this.currentMove[0]][this.currentMove[1]] = this.playerColour;
    this.channel.postMessage({
      type: MessageType.MOVE,
      move: this.currentMove,
      moveStruct: {
        gameAddress: this.gameAddress,
        mvIdx: this.moveIdx,
        code: `(${this.currentMove[0]},${this.currentMove[1]})`,
        hashPrev: undefined,
        hashGameState: undefined
      },
      playerColour: this.playerColour,
    });
    this.currentMove = undefined;
  }

  proposeDraw(): void {
    this.channel.postMessage({
      type: MessageType.DRAW,
      move: undefined,
      moveStruct: null,
      playerColour: this.playerColour
    });
  }

  sendMovesToChain(): void {
    this.gameEthereumService.sendMoves(this.moves);
  }
}
