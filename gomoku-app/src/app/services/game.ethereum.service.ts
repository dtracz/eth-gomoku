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

  async sendMove(moveIndexes: [number, number]) {
    const account = await this.getAccount();
    var zero32 = '0x0000000000000000000000000000000000000000000000000000000000000000';
    const move = {
      'gameAddress': this.gameAddress,
      'mvIdx': 1,
      'code': `(${moveIndexes[0]},${moveIndexes[1]})`,
      'hashPrev': zero32,
      'hashGameState': zero32
    };
    const signature = await this.signService.sign(move, MoveType, account);
    console.log("SIGNATURE:", signature);
    this.sendToBc(move, signature, account).then(status => {
        console.log("Move applied to bc status:", status);
      })
    ;
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

  // games.eventGameInitialized = function (err, data) {
  //   console.log('eventGameInitialized', err, data);
  //   if (err) {
  //     console.log('error occured', err);
  //   } else {
  //     let game = games.add(data.args);
  //     games.openGames.push(game.gameId);
  //
  //     if (web3.eth.accounts.indexOf(game.self.accountId) !== -1) {
  //       $rootScope.$broadcast('message',
  //         'Your game has successfully been created and has the id ' + game.gameId,
  //         'success', 'startgame');
  //       $rootScope.$apply();
  //     }
  //   }
  // };
}
