import {AbstractContractService} from './abstract.contract.service';
import {Injectable} from '@angular/core';

declare let window: any;

@Injectable({
  providedIn: 'root'
})
export class AccountService extends AbstractContractService {

  constructor() {
    super();
  }

  public async getUserBalance(): Promise<any> {
    const account = await this.getAccount();
    return new Promise((resolve, reject) => {
      window.web3.eth.getBalance(account, (err, balance) => {
        if (!err) {
          const retVal = {
            account,
            balance: window.web3.utils.fromWei(balance, 'ether')
          };
          resolve(retVal);
        } else {
          reject({account: 'error', balance: 0});
        }
      });
    }) as Promise<any>;
  }
}
