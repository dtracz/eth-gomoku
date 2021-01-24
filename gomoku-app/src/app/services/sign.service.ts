import {AbstractContractService} from './abstract.contract.service';
import {Injectable} from '@angular/core';

declare let window: any;
declare let require: any;

const Web3EthAbi = require('web3-eth-abi');

@Injectable({
  providedIn: 'root'
})
export class SignService extends AbstractContractService {

  constructor() {
    super();
  }

  sign = (struct, structType, account) => {
    console.log('Signing struct:', struct);
    const code = Web3EthAbi.encodeParameter(structType, struct);
    return window.web3.eth.personal.sign(code, account).then((signature) => {
      signature = signature.substr(2);
      const _r = '0x' + signature.slice(0, 64);
      const _s = '0x' + signature.slice(64, 128);
      const _v = '0x' + signature.slice(128, 130);
      let v_decimal = window.web3.utils.toDecimal(_v);
      if (v_decimal != 27 || v_decimal != 28) {
        v_decimal += 27;
      }
      signature = {v: v_decimal, r: _r, s: _s};
      return signature;
    });
  }
}
