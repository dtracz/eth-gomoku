import {AbstractContractService} from "./abstract.contract.service";
import {Injectable} from '@angular/core';

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

@Injectable({
  providedIn: 'root'
})
export class GameEthereumService extends AbstractContractService {

  gameAddress: string;
  playerName: string;
  playerColour: FieldState;

  constructor() {
    super();
  }

  sendMove(move: [number, number]) {
    this.getAccount();
    const gomokuContract = contract(contractPath);
    gomokuContract.setProvider(this.web3);
    gomokuContract.deployed().then(instance => {
      //todo: fill with correct values
      instance.play({
          gameAddress: this.gameAddress,
          mvIdx: null,
          code: `(${move[0]},${move[1]})`,
          hashPrev: null,
          hashGameState: null
        },
        {
          from: this.account
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
