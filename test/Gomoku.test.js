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
    })
    
    it('deploy', async () => {
        const address = await this.gomoku.address
        assert.notEqual(address, 0x0)
        assert.notEqual(address, '')
        assert.notEqual(address, null)
        assert.notEqual(address, undefined)
    })

    it('start game', async () => {
        const backendAddr = await this.gomoku.selfAdd()
        const initResult = await this.gomoku.initGame(backendAddr, "player_0", {from: accounts[0]})
        const joinResult = await this.gomoku.joinGame("player_1", {from: accounts[1]})
        const event0 = initResult.logs[0].args
        const event1 = joinResult.logs[0].args
        // console.log(accounts)
        // console.log(event0)
        // console.log(event1)
        assert.equal(event0.player, accounts[0])
        assert.equal(event1.player0, accounts[0])
        assert.equal(event1.player1, accounts[1])
        assert.equal(event0.playerName, "player_0")
        assert.equal(event1.player0Name, "player_0")
        assert.equal(event1.player1Name, "player_1")
    })

    it('first move', async () => {
        // const initResult = await this.gomoku.initGame("player_0", {from: accounts[0]})
        // const joinResult = await this.gomoku.joinGame("player_1", {from: accounts[1]})
        // console.log(initResult)
        var gameAddr = await this.gomoku.selfAdd()
        var hash = Web3Utils.keccak256("dupa")
        var zero32 = '0x0000000000000000000000000000000000000000000000000000000000000000'
        const move = {
            'gameAddress': gameAddr,
            'mvIdx': 1,
            'code': "(10,10)",
            'hashPrev': zero32,
            'hashGameState': zero32 
        }
        signature = sign(move, MoveType, accounts[0])
        // console.log(hash)
        // console.log(zero)
        // signature = {v: 27, r: hash, s: hash}
        const moveResult = await this.gomoku.play(move, signature)
        const ev = moveResult.logs[0].args
        // console.log(ev)
    })
})

