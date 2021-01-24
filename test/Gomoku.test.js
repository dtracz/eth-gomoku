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
    })
    
    it('deploy', async () => {
        const address = await this.gomoku.address
        assert.notEqual(address, 0x0)
        assert.notEqual(address, '')
        assert.notEqual(address, null)
        assert.notEqual(address, undefined)
    })
    
    it('start game', async () => {
        const initResult = await this.gomoku.initGame("player_0", {from: accounts[0]})
        const joinResult = await this.gomoku.joinGame("player_1", {from: accounts[1]})
        const event0 = initResult.logs[0].args
        const event1 = joinResult.logs[0].args
        assert.equal(event0.player, accounts[0])
        assert.equal(event1.player0, accounts[0])
        assert.equal(event1.player1, accounts[1])
        assert.equal(event0.playerName, "player_0")
        assert.equal(event1.player0Name, "player_0")
        assert.equal(event1.player1Name, "player_1")
    })

    it('first move', async () => {
        var gameAddr = await this.gomoku.selfAdd()
        const move = {
            'gameAddress': gameAddr,
            'mvIdx': 1,
            'code': "(10,10)",
            'hashPrev': ZERO_32,
            'hashGameState': ZERO_32
        }
        signature = sign(move, MoveType, accounts[0])
        const moveResult = await this.gomoku.play(move, signature, {from: accounts[0],
                                                                    value: 1})
        const ev = moveResult.logs[0].args
        assert.equal(ev.move, "(10,10)")
        assert.equal(ev.player.toNumber(), 0)
    })

    it('second move', async () => {
        const gameAddr = await this.gomoku.selfAdd()
        const first = {
            'gameAddress': gameAddr,
            'mvIdx': 1,
            'code': "(10,10)",
            'hashPrev': ZERO_32,
            'hashGameState': ZERO_32
        }
        const hashFirst = Web3Utils.keccak256(Web3EthAbi.encodeParameter(MoveType, first));
        const second = {
            'gameAddress': gameAddr,
            'mvIdx': 2,
            'code': "(10,11)",
            'hashPrev': hashFirst,
            'hashGameState': ZERO_32
        }
        signature = sign(second, MoveType, accounts[1])
        const moveResult = await this.gomoku.play(second, signature, {from: accounts[1],
                                                                      value: 1})
        const ev = moveResult.logs[0].args
        assert.equal(ev.move, "(10,11)")
        assert.equal(ev.player.toNumber(), 1)
    })

    it('third move sent by other player', async () => {
        const gameAddr = await this.gomoku.selfAdd()
        const first = {
            'gameAddress': gameAddr,
            'mvIdx': 1,
            'code': "(10,10)",
            'hashPrev': ZERO_32,
            'hashGameState': ZERO_32
        }
        const hashFirst = Web3Utils.keccak256(Web3EthAbi.encodeParameter(MoveType, first));
        const second = {
            'gameAddress': gameAddr,
            'mvIdx': 2,
            'code': "(10,11)",
            'hashPrev': hashFirst,
            'hashGameState': ZERO_32
        }
        const hashSecond = Web3Utils.keccak256(Web3EthAbi.encodeParameter(MoveType, second));
        const third = {
            'gameAddress': gameAddr,
            'mvIdx': 3,
            'code': "(11,11)",
            'hashPrev': hashSecond,
            'hashGameState': ZERO_32
        }
        signature = sign(third, MoveType, accounts[0])
        const moveResult = await this.gomoku.play(third, signature, {from: accounts[1]})
        const ev = moveResult.logs[0].args
        assert.equal(ev.move, "(11,11)")
        assert.equal(ev.player.toNumber(), 0)
    })

    it('rest of the game', async () => {
        const gameAddr = await this.gomoku.selfAdd()
        const first = {
            'gameAddress': gameAddr,
            'mvIdx': 1,
            'code': "(10,10)",
            'hashPrev': ZERO_32,
            'hashGameState': ZERO_32
        }
        const hashFirst = Web3Utils.keccak256(Web3EthAbi.encodeParameter(MoveType, first))
        const second = {
            'gameAddress': gameAddr,
            'mvIdx': 2,
            'code': "(10,11)",
            'hashPrev': hashFirst,
            'hashGameState': ZERO_32
        }
        const hashSecond = Web3Utils.keccak256(Web3EthAbi.encodeParameter(MoveType, second))

        var prev = {
            'gameAddress': gameAddr,
            'mvIdx': 3,
            'code': "(11,11)",
            'hashPrev': hashSecond,
            'hashGameState': ZERO_32
        }
        const moves = ["(11,10)",
              "(9,9)", "(10,9)",
            "(12,12)", "(13,13)",
              "(8,8)", ""]
        for (i = 4; i < 11; i++) {
            const hashPrev = Web3Utils.keccak256(Web3EthAbi.encodeParameter(MoveType, prev))
            var move = {
                'gameAddress': gameAddr,
                'mvIdx': i,
                'code': moves[i-4],
                'hashPrev': hashPrev,
                'hashGameState': ZERO_32
            }
            signature = sign(move, MoveType, accounts[(i+1)%2])
            const res = await this.gomoku.play(move, signature, {from: accounts[(i+1)%2]})
            prev = move
            if (i == 10) {
                const ev = res.logs[0].args
                assert.equal(ev.winnerID.toNumber(), 0)
                assert.equal(ev.winnerName, "player_0")
                assert.equal(ev.reward.toNumber(), 2)
            }
        }
    })

    // it('show board', async () => {
    //     const board = await this.gomoku.getApprovedState()
    //     console.log(board)
    // })
})

