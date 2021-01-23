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
    'gameAddress': 'address',
    'mvIdx': 'uint32',
    'code': 'string',
    'hashPrev': 'bytes32',
    'hashGameState': 'bytes32'
  }
}

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

  sendMove(moveIndexes: [number, number]) {
    this.getAccount().then(r => {
      const gomokuContract = contract(contractPath);
      gomokuContract.setProvider(this.web3);

      var zero32 = '0x0000000000000000000000000000000000000000000000000000000000000001'
      const move = {
        'gameAddress': this.gameAddress,
        'mvIdx': 1,
        'code': `(${moveIndexes[0]},${moveIndexes[1]})`,
        'hashPrev': zero32,
        'hashGameState': zero32
      };

      const signature = this.signService.sign(move, MoveType, this.account);
      console.log("Signed move sg:", signature);

      gomokuContract.deployed().then(instance => {
        //todo: fill with correct values
        instance.play(move, signature,
          {
            from: this.account
          });
      });
    });
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
}
