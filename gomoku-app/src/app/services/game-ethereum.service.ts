import {AbstractContractService} from './abstract.contract.service';
import {Injectable} from '@angular/core';
import {Move, MoveType} from '../utils/move';
import {Draw, SpecialType} from '../utils/draw';
import {SignService} from './sign.service';

declare let require: any;
const contractPath = require('../../../../build/contracts/Gomoku.json');
const contract = require('@truffle/contract');

@Injectable({
  providedIn: 'root'
})
export class GameEthereumService extends AbstractContractService {

  finished = false;
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

  sendToBlockchain(move: any, signature: { v: string, r: string, s: string }, account: string): Promise<any> {
    console.log('Sending move to blockchain move:', move, ' signature:', signature, ' account:', account);
    return new Promise((resolve, reject) => {
      const gomokuContract = contract(contractPath);
      gomokuContract.setProvider(this.web3Provider);
      gomokuContract.deployed().then(instance => {
        instance.play(move, signature, {
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

  async acc(): Promise<any> {
    return await this.getAccount();
  }

  sendMovesToChain(moves: Move[], signatures: any[]): Promise<any> {
    this.getAccount()
      .catch(err => alert(`GameEthereumService: sendMovesToChain error: ${err}`));

    return new Promise((resolve, reject) => {
      const gomokuContract = contract(contractPath);
      const currentBid = this.bidAmount;
      this.bidAmount = 0;
      gomokuContract.setProvider(this.web3Provider);
      gomokuContract.deployed().then(instance => {
        return instance.register(moves.length, moves, signatures, {
          from: this.account,
          value: currentBid
        });
      }).then(status => {
        if (status) {
          return resolve(status);
        }
      }).catch(error => {
        alert(`GameEthereumService: cannot send moves to chain: ${error}`);
        return reject(error);
      });
    });
  }

  async proposeDraw(hashPrev: string, gameAddress: string): Promise<any> {
    this.getAccount()
      .catch(err => alert(`GameEthereumService: proposeDraw error: ${err}`));

    return new Promise(async (resolve, reject) => {
      const draw: Draw = {
        gameAddress,
        hashPrev,
        code: 'draw'
      };
      const signature = await this.signService.sign(draw, SpecialType, this.account);
      const gomokuContract = contract(contractPath);
      gomokuContract.setProvider(this.web3Provider);
      gomokuContract.deployed().then(instance => {
        return instance.proposeDraw(draw, signature, {
          from: this.account
        });
      }).then(status => {
        if (status) {
          return resolve(status);
        }
      }).catch(err => {
        alert(`GameEthereumService: cannot propose draw to chain: ${err}`);
        return reject(err);
      });
    });
  }

  bid(bidAmount: number): void {
    this.bidAmount = bidAmount;
  }
}
