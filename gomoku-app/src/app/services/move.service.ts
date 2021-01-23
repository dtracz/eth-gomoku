import {AbstractContractService} from "./abstract.contract.service";
import {Injectable} from '@angular/core';

declare let window: any;
declare let require: any;

const Web3 = require('web3');
const contractPath = require('../../../../build/contracts/Gomoku.json');
const contract = require("@truffle/contract");
const Web3EthAbi = require('web3-eth-abi');

@Injectable({
  providedIn: 'root'
})
export class MoveService extends AbstractContractService {

  constructor() {
    super();
  }

  MoveType = {
    'Move' : {
      'gameAddress': 'address',
      'mvIdx': 'uint32',
      'code': 'string',
      'hashPrev': 'bytes32',
      'hashGameState': 'bytes32'
    }
  }

  move(playerName: string, gameAddress: string) {
    this.getAccount();
    const gomokuContract = contract(contractPath);

    var zero32 = '0x0000000000000000000000000000000000000000000000000000000000000000'
    const move = {
      'gameAddress': gameAddress,
      'mvIdx': 1,
      'code': "(10,10)",
      'hashPrev': zero32,
      'hashGameState': zero32
    }

    const signature = this.sign(move, this.MoveType, this.account)
    gomokuContract.setProvider(this.web3);
    gomokuContract.deployed().then(instance => {
      instance.play(move, signature,
        {
          from: this.account
        });
    });
  }

  sign = (struct, structType, account) => {
    const code = Web3EthAbi.encodeParameter(structType, struct)
    let signature = window.web3.eth.sign(account, code);
    signature = signature.substr(2);
    const _r = '0x' + signature.slice(0, 64);
    const _s = '0x' + signature.slice(64, 128);
    const _v = '0x' + signature.slice(128, 130);
    let v_decimal = window.web3.toDecimal(_v);
    if(v_decimal != 27 || v_decimal != 28) {
      v_decimal += 27
    }
    signature = {v: v_decimal, r: _r, s: _s};
    return signature
  }
}
