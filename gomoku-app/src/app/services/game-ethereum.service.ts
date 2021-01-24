import {AbstractContractService} from './abstract.contract.service';
import {Injectable} from '@angular/core';
import {Move, MoveType} from '../utils/move';
import {SignService} from './sign.service';

declare let require: any;
const contractPath = require('../../../../build/contracts/Gomoku.json');
const contract = require('@truffle/contract');

@Injectable({
  providedIn: 'root'
})
export class GameEthereumService extends AbstractContractService {

  gameAddress: string;
  playerName: string;
  private bidAmount = 0;

  constructor(private signService: SignService) {
    super();
  }

  async sendMove(move: Move): Promise<void> {
    const account = await this.getAccount();
    const signature = await this.signService.sign(move, MoveType, account);
    console.log('SIGNATURE:', signature);
    this.sendToBlockchain(move, signature, account).then(status => {
      console.log('Move applied to bc status:', status);
    });
  }

  sendToBlockchain(move: any, signature: string, account: string): Promise<any> {
    this.bidAmount = 0;
    console.log('Sending move to blockchain move:', move, ' signature:', signature, ' account:', account);
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
          console.log('Sent to blockchain result:', res);
          return res;
        }
        console.log('Sent to blockchain no result');
      }).catch(error => {
          if (error) {
            alert(`GameEthereumService: Can't send to blockchain error: ${error}`);
            return reject(error);
          }
        }
      );
    });
  }

  sendMovesToChain(moves: Move[]): void {
    this.getAccount()
      .catch(err => alert(`GameEthereumService: sendMovesToChain error: ${err}`));
  }

  proposeDraw(): void {
    this.getAccount()
      .catch(err => alert(`GameEthereumService: proposeDraw error: ${err}`));
  }

  bid(bidAmount: number): void {
    this.bidAmount = bidAmount;
  }
}
