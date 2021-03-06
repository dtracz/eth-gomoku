import {AbstractContractService} from './abstract.contract.service';
import {Injectable} from '@angular/core';
import {eventGameJoined, eventMovePlayed} from '../utils/events';
import {GameService} from './game.service';

declare let require: any;
const contractPath = require('../../../../build/contracts/Gomoku.json');
const contract = require('@truffle/contract');

@Injectable({
  providedIn: 'root'
})
export class StartService extends AbstractContractService {

  constructor(private gameService: GameService) {
    super();
  }

  startGame(playerName: string): Promise<any> {
    this.getAccount()
      .catch(err => alert(`Start: get account error: ${err}`));

    return new Promise((resolve, reject) => {
      const gomokuContract = contract(contractPath);
      gomokuContract.setProvider(this.web3Provider);
      gomokuContract.deployed().then(instance => {
        instance.GameJoined({}, eventGameJoined);
        instance.MovePlayed({}, eventMovePlayed);
        instance.GameInitialized({}, (err, message) => {
          this.gameService.gameInit = true;
        });
        instance.GameFinished({}, (err, message) => {
          this.gameService.finished = true;
        });
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
