const Gomoku = artifacts.require('./Gomoku.sol')

var Web3 = require('web3')
var web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:7545'))
const Web3EthAbi = require('web3-eth-abi');
const Web3Utils = require('web3-utils');

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
        for (i = 0; i < 10; i++) {
            var move = {
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
        // console.log(moves)
        // console.log(signs)
        const res = await this.gomoku.register(10, moves, signs)
        console.log(res.logs[0].args)
        console.log(res.logs[1].args)
        console.log(res.logs[2].args)
        console.log(res.logs[3].args)
        console.log(res.logs[4].args)
        console.log(res.logs[5].args)
        console.log(res.logs[6].args)
        console.log(res.logs[7].args)
        console.log(res.logs[8].args)
        console.log(res.logs[9].args)
    })
})

