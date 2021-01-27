const Gomoku = artifacts.require('./Gomoku.sol')

var Web3 = require('web3')
var web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:7545'))
const Web3EthAbi = require('web3-eth-abi');
const Web3Utils = require('web3-utils');

const SpecialType = {
    'Special' : {
        'gameAddress': 'address',
        'hashPrev': 'bytes32',
        'code': 'string',
    }
}

const MoveType = {
    'Move' : {
        'gameAddress': 'address',
        'mvIdx': 'uint32',
        'code': 'string',
        'hashPrev': 'bytes32',
        'hashGameState': 'bytes32'
    }
}

const ZERO_32 = '0x0000000000000000000000000000000000000000000000000000000000000000'

function ascii2hex(str){
  var u=unescape(encodeURIComponent(str))
  return u.split('').map(function(c){return c.charCodeAt(0).toString(16)}).join('')
}

function sign(struct, structType, account) {
    const code = Web3EthAbi.encodeParameter(structType, struct)
    var signature = web3.eth.sign(account, code)
    signature = signature.substr(2);
    const _r = '0x' + signature.slice(0, 64)
    const _s = '0x' + signature.slice(64, 128)
    const _v = '0x' + signature.slice(128, 130)
    var v_decimal = web3.toDecimal(_v)
    if(v_decimal != 27 || v_decimal != 28) {
        v_decimal += 27
    }
    signature = {v: v_decimal, r: _r, s: _s}
    return signature
}

contract('Gomoku', (accounts) => {
    before(async () => {
        this.gomoku = await Gomoku.deployed()
        const initResult = await this.gomoku.initGame("player_0", {from: accounts[0]})
        const joinResult = await this.gomoku.joinGame("player_1", {from: accounts[1]})
    })
    
    it('all game', async () => {
        const gameAddr = await this.gomoku.address
        const moveCodes = ["(10,10)", "(10,11)",
                           "(11,11)", "(11,10)",
                             "(9,9)", "(10,9)",
                           "(12,12)", "(13,13)",
                             "(8,8)", "(14,14)"]
        var moves = []
        var signs = []
        var hashPrev = ZERO_32
        var move
        for (i = 0; i < 8; i++) {
            move = {
                'gameAddress': gameAddr,
                'mvIdx': i+1,
                'code': moveCodes[i],
                'hashPrev': hashPrev,
                'hashGameState': ZERO_32
            }
            signature = sign(move, MoveType, accounts[i%2])
            moves.push(move)
            signs.push(signature)
            hashPrev = Web3Utils.keccak256(Web3EthAbi.encodeParameter(MoveType, move))
        }
        const resMv = await this.gomoku.register(8, moves, signs)

        const drawProp = {
            'gameAddress': gameAddr,
            'hashPrev': hashPrev,
            'code': "draw"
        }
        const drawSing0 = sign(drawProp, SpecialType, accounts[0])
        const res0 = await this.gomoku.proposeDraw(drawProp, drawSing0)
        console.log(res0.logs[0].args)
        const drawSing1 = sign(drawProp, SpecialType, accounts[1])
        const res1 = await this.gomoku.proposeDraw(drawProp, drawSing1)
        console.log(res1.logs[0].args)
        console.log(res1.logs[1].args)
    })
})

