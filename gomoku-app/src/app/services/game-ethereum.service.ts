import {AbstractContractService} from './abstract.contract.service';
import {Injectable} from '@angular/core';
import {Move} from '../utils/move';
import {SignService} from './sign.service';

declare let require: any;
const contractPath = require('../../../../build/contracts/Gomoku.json');
const contract = require('@truffle/contract');

const MoveType = {
  Move : {
    gameAddress: 'string',
    mvIdx: 'uint32',
    code: 'string',
    hashPrev: 'bytes32',
    hashGameState: 'bytes32'
  }
};

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

  async sendMove(moveIndexes: [number, number]): Promise<void> {
    const account = await this.getAccount();
    const zero32 = '0x0000000000000000000000000000000000000000000000000000000000000000';
    const move = {
      gameAddress: this.gameAddress,
      mvIdx: 1,
      code: `(${moveIndexes[0]},${moveIndexes[1]})`,
      hashPrev: zero32,
      hashGameState: zero32
    };
    const signature = await this.signService.sign(move, MoveType, account);
    console.log('SIGNATURE:', signature);
    this.sendToBc(move, signature, account).then(status => {
        console.log('Move applied to bc status:', status);
      })
    ;
  }

  sendToBc(move: any, signature: string, account: string): Promise<any> {
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
            console.log('Can\'t send to blockchain error:', error);
            return reject(error);
          }
        }
      );
    });
  }

  sendMovesToChain(moves: Move[]): void {
    this.getAccount()
      .catch(err => alert(err));
  }

  proposeDraw(): void {
    this.getAccount()
      .catch(err => alert(err));
  }

  bid(bidAmount: number): void {
    this.bidAmount = bidAmount;
  }
}
