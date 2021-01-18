import {AbstractContractService} from "./abstract.contract.service";
import {Injectable} from '@angular/core';

declare let window: any;
declare let require: any;

const Web3 = require('web3');

@Injectable({
  providedIn: 'root'
})
export class AccountService extends AbstractContractService {

  constructor() {
    super();
  }

  public async getUserBalance(): Promise<any> {
    const account = await this.getAccount();
    console.log('account.service :: getUserBalance :: account');
    console.log(account);
    return new Promise((resolve, reject) => {
      window.web3.eth.getBalance(account, (err, balance) => {
        console.log('account.service :: getUserBalance :: getBalance');
        console.log(balance);
        if (!err) {
          const retVal = {
            account: account,
            balance: window.web3.utils.fromWei(balance, 'ether')
          };
          console.log('account.service :: getUserBalance :: getBalance :: retVal');
          console.log(retVal);
          resolve(retVal);
        } else {
          reject({account: 'error', balance: 0});
        }
      });
    }) as Promise<any>;
  }
}
