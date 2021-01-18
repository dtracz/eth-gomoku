declare let window: any;
declare let require: any;

import {Injectable} from '@angular/core';

const Web3 = require('web3');
const contract = require('../../../../build/contracts/Gomoku.json');

@Injectable({
  providedIn: 'root'
})
export class GameService {

  constructor() { }
}
