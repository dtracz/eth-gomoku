App = {
  loading: false,
  contracts: {},

  load: async () => {
    await App.loadWeb3()
    await App.loadAccount()
    await App.loadContract()
    await App.render()
  },

  // https://medium.com/metamask/https-medium-com-metamask-breaking-change-injecting-web3-7722797916a8
  loadWeb3: async () => {
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider
      web3 = new Web3(web3.currentProvider)
    } else {
      window.alert("Please connect to Metamask.")
    }
    // Modern dapp browsers...
    if (window.ethereum) {
      window.web3 = new Web3(ethereum)
      try {
        // Request account access if needed
        await ethereum.enable()
        // Acccounts now exposed
        web3.eth.sendTransaction({/* ... */})
      } catch (error) {
        // User denied account access...
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = web3.currentProvider
      window.web3 = new Web3(web3.currentProvider)
      // Acccounts always exposed
      web3.eth.sendTransaction({/* ... */})
    }
    // Non-dapp browsers...
    else {
      console.log('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  },

  loadAccount: async () => {
    // Set the current blockchain account
    App.account = web3.eth.accounts[0]
    console.log(App.account)
  },

  loadContract: async () => {
    // Create a JavaScript version of the smart contract
    const gomoku = await $.getJSON('Gomoku.json')
    App.contracts.Gomoku = TruffleContract(gomoku)
    App.contracts.Gomoku.setProvider(App.web3Provider)

    // Hydrate the smart contract with values from the blockchain
    App.gomoku = await App.contracts.Gomoku.deployed()
  },

  render: async () => {
    // Prevent double render
    if (App.loading) {
      return
    }

    // Update app loading state
    App.setLoading(true)

    // Render Account
    $('#account').html(App.account)


    // Update loading state
    App.setLoading(false)
  },

  setLoading: (boolean) => {
    App.loading = boolean
    const loader = $('#loader')
    const content = $('#content')
    if (boolean) {
      loader.show()
      content.hide()
    } else {
      loader.hide()
      content.show()
    }
  },

  initGame: () => {
    console.log('Trying to initialize game');
    App.gomoku.initGame("Jack");
    console.log("gamed initialized", App.gomoku.player0)
  },

  joinGame: () => {
    console.log('Trying to join game');
    App.gomoku.joinGame("John");
    console.log("gamed joined player0:", App.gomoku.player0, " player1:", App.gomoku.player1)
  },


}

$(() => {
  $(window).load(() => {
    App.load()
  });
  $('#init-button').click(() => {
    App.initGame();
  });
  $('#join-button').click(() => {
    App.joinGame();
  });
})