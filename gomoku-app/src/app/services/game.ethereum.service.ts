import {AbstractContractService} from "./abstract.contract.service";
import {Injectable} from '@angular/core';
import {SignService} from "./sign.service";

declare let window: any;
declare let require: any;

const Web3 = require('web3');
const contractPath = require('../../../../build/contracts/Gomoku.json');
const contract = require("@truffle/contract");

export enum FieldState {
  Free,
  White,
  Black
}

class Move {
  address: string;

}
const MoveType = {
  'Move' : {
    'gameAddress': 'string',
    'mvIdx': 'uint32',
    'code': 'string',
    'hashPrev': 'bytes32',
    'hashGameState': 'bytes32'
  }
};

const zero32 = '0x0000000000000000000000000000000000000000000000000000000000000000';

@Injectable({
  providedIn: 'root'
})
export class GameEthereumService extends AbstractContractService {

  gameAddress: string;
  playerName: string;
  playerColour: FieldState;

  constructor(private signService: SignService) {
    super();
  }

  async sendMove(moveIndexes: [number, number], mvIdx: number, myPrevHash: string, hisMove: string) {
    const account = await this.getAccount();
    const prevHash = this.makePrevHash(mvIdx, myPrevHash, hisMove);

    const move = {
      'gameAddress': this.gameAddress,
      'mvIdx': mvIdx,
      'code': `(${moveIndexes[0]},${moveIndexes[1]})`,
      'hashPrev': prevHash,
      'hashGameState': zero32
    };

    const signature = await this.signService.sign(move, MoveType, account);
    console.log("SIGNATURE:", signature);
    this.sendToBc(move, signature, account).then(status => {
        console.log("Move applied to bc status:", status);
      })
    ;
    const myHash = this.signService.hash(move, MoveType);
    return myHash;
  }

  sendToBc(move: any, signature: string, account: string): Promise<any> {
    console.log("Sending move to blockchain move:", move, " signature:", signature, " account:", account);
    return new Promise((resolve, reject) => {
      const gomokuContract = contract(contractPath);
      gomokuContract.setProvider(this.web3);
      gomokuContract.deployed().then(instance => {
        instance.play(move, signature,
          {
            from: account
          });
      }).then(result => {
        if (result) {
          const res = resolve(result);
          console.log("Sent to blockchain result:", res);
          return res;
        }
        console.log("Sent to blockchain no result");
      }).catch(error => {
          if (error) {
            console.log("Can't send to blockchain error:", error);
            return reject(error);
          }
        }
      );
    });
  }

  makePrevHash(mvIdx: number, myPrevHash: string, hisMove: string) {
    if (mvIdx == 1) {
      return zero32;
    }
    const prevMove = {
      'gameAddress': this.gameAddress,
      'mvIdx': mvIdx-1,
      'code': hisMove,
      'hashPrev': myPrevHash,
      'hashGameState': zero32
    };
    return this.signService.hash(prevMove, MoveType);
  }

  proposeDraw(playerName: string, gameAddress: string) {
    this.getAccount();
    const gomokuContract = contract(contractPath);
    gomokuContract.setProvider(this.web3);
    gomokuContract.deployed().then(instance => {
      instance.joinGame(playerName, gameAddress,
        {
          from: this.account
        });
    });
  }

  bid(playerName: string, gameAddress: string) {
    this.getAccount();
    const gomokuContract = contract(contractPath);
    gomokuContract.setProvider(this.web3);
    gomokuContract.deployed().then(instance => {
      instance.joinGame(playerName, gameAddress,
        {
          from: this.account
        });
    });
  }

  // eventGameJoined(err, data) {
  //   console.log("Someone joined data:", data);
  //   //enable board
  // };
  //
  // eventMovePlayed(err, data) {
  //   console.log("Someone made a move:", data);
  //   //enable board
  //   const args = status['logs'][0]['args'];
  //   console.log("received args:", args);
  //   const hisMove = args.move;
  // };
}
