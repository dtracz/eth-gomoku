const GomokuBackend = artifacts.require("GomokuBackend");
const Gomoku = artifacts.require("Gomoku");

module.exports = function(deployer) {
  deployer.deploy(GomokuBackend);
  deployer.deploy(Gomoku);
};

