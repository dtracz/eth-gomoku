import {AbstractContractService} from "./abstract.contract.service";
import {Injectable} from '@angular/core';

declare let window: any;
declare let require: any;

const Web3 = require('web3');
const contractPath = require('../../../../build/contracts/Gomoku.json');
const contract = require("@truffle/contract");

@Injectable({
  providedIn: 'root'
})
export class GameService extends AbstractContractService {

  constructor() {
    super();
  }
}
