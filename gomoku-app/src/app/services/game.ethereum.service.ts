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

  sendMove(moveIndexes: [number, number]) {
    this.getAccount().then(r => {
      var zero32 = '0x0000000000000000000000000000000000000000000000000000000000000000'
      const move = {
        'gameAddress': this.gameAddress,
        'mvIdx': 1,
        'code': `(${moveIndexes[0]},${moveIndexes[1]})`,
        'hashPrev': zero32,
        'hashGameState': zero32
      };
      const signature = this.signService.sign(move, MoveType, this.account);
      console.log("Signed move sg:", signature);
      this.sendToBc(move, signature).then(status => {
        console.log("Move applied to bc status:", status);
      })
    });
  }
  sendToBc(move: any, signature: string): Promise<any> {
    console.log("send to bc")
    return new Promise((resolve, reject) => {
      const gomokuContract = contract(contractPath);
      gomokuContract.setProvider(this.web3);
      gomokuContract.deployed().then(instance => {
        instance.play(move, signature,
          {
            from: this.account
          });
      }).then(result => {
        if (result) {
          const res = resolve(result);
          console.log("halko res:", res);
          return res;
        }
      }).catch(error => {
          if (error)
            return reject(error);
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
