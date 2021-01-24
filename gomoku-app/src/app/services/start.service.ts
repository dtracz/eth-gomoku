import {AbstractContractService} from './abstract.contract.service';
import {Injectable} from '@angular/core';
import {eventGameJoined, eventMovePlayed} from '../utils/events';

declare let require: any;
const contractPath = require('../../../../build/contracts/Gomoku.json');
const contract = require('@truffle/contract');

@Injectable({
  providedIn: 'root'
})
export class StartService extends AbstractContractService {

  constructor() {
    super();
  }

  startGame(playerName: string): Promise<any> {
    this.getAccount()
      .catch(err => alert(`Start: get account error: ${err}`));

    return new Promise((resolve, reject) => {
      const gomokuContract = contract(contractPath);
      gomokuContract.setProvider(this.web3);
      gomokuContract.deployed().then(instance => {
        instance.GameJoined({}, eventGameJoined);
        instance.MovePlayed({}, eventMovePlayed);
        return instance.initGame(playerName, {
          from: this.account
        });
      }).then(status => {
        if (status) {
          return resolve(status);
        }
      }).catch(err => {
        alert(`Start error:${err}`);
        return reject('start.service error');
      });
    });
  }
}
