import {Injectable} from '@angular/core';

declare let require: any;
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:7545'));
const Web3EthAbi = require('web3-eth-abi');
const Web3Utils = require('web3-utils');

@Injectable({
  providedIn: 'root'
})
export class SignService {

  constructor() {
  }

  async sign(struct, structType, account): Promise<{ v: string, r: string, s: string }> {
    const code = Web3EthAbi.encodeParameter(structType, struct);
    let signature = await web3.eth.sign(code, account);
    signature = signature.substr(2);
    const r = '0x' + signature.slice(0, 64);
    const s = '0x' + signature.slice(64, 128);
    const v = '0x' + signature.slice(128, 130);
    let vDecimal = Web3Utils.toDecimal(v);
    if (vDecimal != 27 || vDecimal != 28) {
      vDecimal += 27;
    }
    return {v: vDecimal, r, s};
  }

  hash(struct, structType): string {
    return Web3Utils.keccak256(Web3EthAbi.encodeParameter(structType, struct));
  }
}
