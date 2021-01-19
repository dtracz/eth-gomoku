const Gomoku = artifacts.require('./Gomoku.sol')

contract('Gomoku', (accounts) => {
    before(async () => {
        this.gomoku = await Gomoku.deployed()
    })
    
    it('deploys successfully', async () => {
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
})

