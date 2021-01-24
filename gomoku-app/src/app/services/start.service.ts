import {AbstractContractService} from "./abstract.contract.service";
import {Injectable} from '@angular/core';
import {eventGameJoined, eventMovePlayed} from "./events";

declare let window: any;
declare let require: any;

const Web3 = require('web3');
const contractPath = require('../../../../build/contracts/Gomoku.json');
const contract = require("@truffle/contract");

@Injectable({
  providedIn: 'root'
})
export class StartService extends AbstractContractService {

  constructor() {
    super();
  }

  startGame(playerName: string): Promise<any> {
    this.getAccount();
    return new Promise((resolve, reject) => {
      const gomokuContract = contract(contractPath);
      gomokuContract.setProvider(this.web3);
      gomokuContract.deployed().then(instance => {
        instance.GameJoined({}, eventGameJoined);
        instance.MovePlayed({}, eventMovePlayed);
        return instance.initGame(playerName,
          {
            from: this.account
          });
      }).then(status => {
        // for (let s in status) {
        //   console.log(s + ":");
        //   console.log(status[s]);
        // }
        if (status) {
          return resolve(status);
        }
      }).catch(err => {
        console.log(err);
        return reject('start.service error');
      });
    });
  }
}
