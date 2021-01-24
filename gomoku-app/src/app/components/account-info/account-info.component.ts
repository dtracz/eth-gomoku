import {Component, OnInit} from '@angular/core';
import {AccountService} from '../../services/account.service';

@Component({
  selector: 'app-account-info',
  templateUrl: './account-info.component.html',
  styleUrls: ['./account-info.component.css']
})
export class AccountInfoComponent implements OnInit {

  constructor(private accountService: AccountService) {
  }

  user: { address, transferAddress, balance, amount, remarks };

  ngOnInit(): void {
    this.user = {address: '', transferAddress: '', balance: '', amount: '', remarks: ''};
    this.getAccountAndBalance();
  }

  getAccountAndBalance(): void {
    this.accountService.getUserBalance().then((retAccount: any) => {
      this.user.address = retAccount.account;
      this.user.balance = retAccount.balance;
    }).catch(error => {
      alert(`AccountComponent: cant get account and balance: ${error}`);
    });
  }

}
