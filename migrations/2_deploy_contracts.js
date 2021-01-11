const Gomoku = artifacts.require("Gomoku");

module.exports = function(deployer) {
  deployer.deploy(Gomoku);
};

