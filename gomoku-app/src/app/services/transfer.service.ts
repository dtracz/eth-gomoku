import {Injectable} from '@angular/core';
import {AbstractContractService} from "./abstract.contract.service";

declare let require: any;
declare let window: any;

const Web3 = require('web3');
const tokenAbi = require('../../../../build/contracts/Gomoku.json');

@Injectable({
  providedIn: 'root'
})
export class TransferService extends AbstractContractService {

  constructor() {
    super();
  }

  public async getUserBalance(): Promise<any> {
    const account = await this.getAccount();
    console.log('transfer.service :: getUserBalance :: account');
    console.log(account);
    return new Promise((resolve, reject) => {
      window.web3.eth.getBalance(account, function (err, balance) {
        console.log('transfer.service :: getUserBalance :: getBalance');
        console.log(balance);
        if (!err) {
          const retVal = {
            account: account,
            balance: balance
          };
          console.log('transfer.service :: getUserBalance :: getBalance :: retVal');
          console.log(retVal);
          resolve(retVal);
        } else {
          reject({account: 'error', balance: 0});
        }
      });
    }) as Promise<any>;
  }

  transferEther(value) {
    const that = this;
    console.log('transfer.service :: transferEther to: ' +
      value.transferAddress + ', from: ' + that.account + ', amount: ' + value.amount);
    return new Promise((resolve, reject) => {
      console.log('transfer.service :: transferEther :: tokenAbi');
      console.log(tokenAbi);
      const contract = require('@truffle/contract');
      const transferContract = contract(tokenAbi);
      transferContract.setProvider(that.web3);
      console.log('transfer.service :: transferEther :: transferContract');
      console.log(transferContract);
      transferContract.deployed().then(instance => instance.pay(
        value.transferAddress,
        {
          from: that.account,
          value: value.amount
        })).then(status => {
        if (status) {
          return resolve({status: true});
        }
      }).catch(error => {
        console.log(error);
        return reject('transfer.service error');
      });
    });
  }
}
