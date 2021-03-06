import {Injectable} from '@angular/core';
import {GameEthereumService} from './game-ethereum.service';
import {FieldColour} from '../utils/field-colour';
import {Move, MoveType} from '../utils/move';
import {MessageType} from '../utils/message-type';
import {Message} from '../utils/message';
import {SignService} from './sign.service';

const GOMOKU_SIZE = 19;
const ZERO_32 = '0x0000000000000000000000000000000000000000000000000000000000000000';

@Injectable({
  providedIn: 'root'
})
export class GameService {

  private readonly channel: BroadcastChannel;
  private readonly moves: Move[];
  private readonly signatures: any[];
  private readonly hashGameState = ZERO_32;
  readonly fieldStates: FieldColour[][];
  playerColour: FieldColour;
  playerName: string;
  gameAddress: string;

  // game move state
  currentMove: [number, number];
  moveIdx: number;
  private hashPrev = ZERO_32;

  // game state
  finished = false;
  turn = false;
  gameInit = false;
  loaded = false;
  canProposeDraw = true;
  bidPropose = false;

  constructor(private gameEthereumService: GameEthereumService, private signService: SignService) {
    this.moves = [];
    this.signatures = [];
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
          this.drawMessageHandler();
          break;
        }
        case MessageType.DRAW_AGREE: {
          this.gameEthereumService.proposeDraw(this.hashPrev, this.gameAddress)
            .catch(err => {
              alert(`Proposing draw failed: ${err}`);
            });
          break;
        }
        case MessageType.DRAW_REJECT: {
          alert('Draw propose rejected');
          break;
        }
      }
    });
  }

  private moveMessageHandler(message: Message): void {
    const move = message.move;
    const moveStruct = message.moveStruct;
    const field = this.fieldStates[move[0]][move[1]];
    if (field === FieldColour.Empty) {
      this.fieldStates[move[0]][move[1]] = message.playerColour;
      this.turn = !this.turn;
      this.hashPrev = this.signService.hash(moveStruct, MoveType);
      this.moves.push(moveStruct);
      this.signatures.push(message.signature);
      this.canProposeDraw = true;
    } else {
      alert('invalid move received');
    }
  }

  private drawMessageHandler(): void {
    if (confirm('Do you agree to draw?')) {
      this.gameEthereumService.proposeDraw(this.hashPrev, this.gameAddress)
        .catch(err => {
          alert(`proposing draw failed: ${err}`);
        });
      this.channel.postMessage({
        type: MessageType.DRAW_AGREE
      });
    } else {
      this.channel.postMessage({
        type: MessageType.DRAW_REJECT
      });
    }
  }

  private checkWin(): void {
    this.channel.postMessage({
      type: MessageType.WIN
    });
  }

  movesCount(): number {
    return this.moves.length;
  }

  sendLoaded(): void {
    this.loaded = true;
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
    const moveStruct: Move = {
      gameAddress: this.gameAddress,
      mvIdx: this.moveIdx,
      code: `(${this.currentMove[0]},${this.currentMove[1]})`,
      hashPrev: this.hashPrev,
      hashGameState: this.hashGameState
    };
    this.moveIdx += 2;
    this.gameEthereumService.acc().then(async acc => {
      const signature = await this.signService.sign(moveStruct, MoveType, acc);
      this.signatures.push(signature);
      this.moves.push(moveStruct);
      this.channel.postMessage({
        type: MessageType.MOVE,
        move: this.currentMove,
        moveStruct,
        playerColour: this.playerColour,
        signature
      });
      this.currentMove = undefined;
    }).catch(err => {
      alert(`GameService: problem with sending move: ${err}`);
    });
  }

  proposeDraw(): void {
    this.channel.postMessage({
      type: MessageType.DRAW,
      move: undefined,
      moveStruct: undefined,
      playerColour: this.playerColour
    });
    this.canProposeDraw = false;
  }

  sendMovesToChain(): void {
    this.gameEthereumService.sendMovesToChain(this.moves, this.signatures)
      .catch(err => {
        alert(`GameService: sendMovesToChain error: ${err}`);
      });
    this.bidPropose = false;
  }

  bid(bidAmount: number): void {
    this.gameEthereumService.bid(bidAmount);
    this.bidPropose = true;
  }
}
