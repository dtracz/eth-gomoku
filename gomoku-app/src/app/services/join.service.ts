import {AbstractContractService} from './abstract.contract.service';
import {Injectable} from '@angular/core';
import {eventMovePlayed} from '../utils/events';
import {GameService} from './game.service';

declare let require: any;
const contractPath = require('../../../../build/contracts/Gomoku.json');
const contract = require('@truffle/contract');

@Injectable({
  providedIn: 'root'
})
export class JoinService extends AbstractContractService {

  constructor(private gameService: GameService) {
    super();
  }

  joinGame(playerName: string): Promise<any> {
    this.getAccount()
      .catch(err => alert(`Join: get account error: ${err}`));

    return new Promise((resolve, reject) => {
      const gomokuContract = contract(contractPath);
      gomokuContract.setProvider(this.web3);
      gomokuContract.deployed().then(instance => {
        instance.MovePlayed({}, eventMovePlayed);
        instance.GameFinished({}, (err, data) => {
          this.gameService.finished = true;
        });
        return instance.joinGame(playerName, {
          from: this.account
        });
      }).then(result => {
        if (result) {
          return resolve(result);
        }
      }).catch(error => {
          if (error) {
            return reject(error);
          }
        }
      );
    });
  }
}
