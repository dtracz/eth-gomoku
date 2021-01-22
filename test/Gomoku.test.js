const Gomoku = artifacts.require('./Gomoku.sol')
var Web3 = require('web3')
var web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:7545'))
const Web3EthAbi = require('web3-eth-abi');
const Web3Utils = require('web3-utils');

contract('Gomoku', (accounts) => {
    before(async () => {
        this.gomoku = await Gomoku.deployed()
    })
    
    // it('deploy', async () => {
    //     const address = await this.gomoku.address
    //     assert.notEqual(address, 0x0)
    //     assert.notEqual(address, '')
    //     assert.notEqual(address, null)
    //     assert.notEqual(address, undefined)
    // })
    //
    // it('start game', async () => {
    //     const initResult = await this.gomoku.initGame("player_0", {from: accounts[0]})
    //     const joinResult = await this.gomoku.joinGame("player_1", {from: accounts[1]})
    //     const event0 = initResult.logs[0].args
    //     const event1 = joinResult.logs[0].args
    //     // console.log(accounts)
    //     // console.log(event0)
    //     // console.log(event1)
    //     assert.equal(event0.player, accounts[0])
    //     assert.equal(event1.player0, accounts[0])
    //     assert.equal(event1.player1, accounts[1])
    //     assert.equal(event0.playerName, "player_0")
    //     assert.equal(event1.player0Name, "player_0")
    //     assert.equal(event1.player1Name, "player_1")
    // })


    it('passing struct', async () => {
        const dummyType = { 'TestStruct' : {'n': 'uint8', 'str': 'string' } }
        var dummy = {n: 28, str: "bar"}

        const code = Web3EthAbi.encodeParameter(dummyType, dummy)
        // const hash = Web3Utils.keccak256(code)
        var signature = web3.eth.sign(accounts[0], code)


        signature = signature.substr(2);
        const _r = '0x' + signature.slice(0, 64)
        const _s = '0x' + signature.slice(64, 128)
        const _v = '0x' + signature.slice(128, 130)
        var v_decimal = web3.toDecimal(_v)
        if(v_decimal != 27 || v_decimal != 28) {
            v_decimal += 27
        }

        const res = await this.gomoku.testFoo(dummy, {v: v_decimal, r: _r, s: _s})
        const ev = res.logs[0].args
        console.log(ev)
        console.log(accounts[0])
        console.log(code)

    })
})

