pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2; // for passing structs

import "./GomokuBackend.sol";

contract Gomoku {
    address public selfAdd = address(this);
    address payable[2] public playerAdd;
    mapping(address => int8) public playerID;
    string[2] playerName;
    int8 firstPlayer; // who starts the game

    GomokuBackend private game;
    bool unapplied;
    Move public lastMove;
    int8 lastPlayer;  // who played last move
    uint lastBlockstamp;

    int8 drawProposal = -1;
    uint[2] balance;

    uint32 patience = 1000;

    struct Move {
        address gameAddress;
        uint32 mvIdx;
        string code;
        bytes32 hashPrev;
        bytes32 hashGameState;
    }

    struct Signature {
         uint8 v;
         bytes32 r;
         bytes32 s;
    }


    event GameInitialized(address indexed player, string playerName,
                          int8 firstPlayer, uint coins);
    event GameJoined(address indexed player0, string player0Name,
                     address indexed player1, string player1Name,
                     int8 firstPlayer, uint coins);
    event MovePlayed(string move, int8 player);
    event GameFinished(int8 winnerID, string winnerName, uint reward);


    function uint2bytes(uint16 i)
        private
        pure
        returns(string memory)
    {
        if (i == 0)
            return "0";
        uint16 j = i;
        uint8 length;
        while (j != 0){
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint8 k = length - 1;
        while (i != 0){
            bstr[k--] = byte(uint8(48 + i % 10));
            i /= 10;
        }
        return string(bstr);
    }

    function getApprovedState()
        view
        public
        returns(string memory)
    {
        return game.getStringState();
    }

    function sigRecover(bytes memory _code, Signature memory _sign)
        pure
        private
        returns(address)
    {
        string memory _lgth = uint2bytes(uint16(_code.length));
        bytes memory _msg = abi.encodePacked("\x19Ethereum Signed Message:\n", _lgth, _code);
        bytes32 _hash = keccak256(_msg);
        return ecrecover(_hash, _sign.v, _sign.r, _sign.s);
    }

    modifier metadataVerifivation(Move memory _move, Signature memory _sign) {
        // verify if move is for this game
        require(_move.gameAddress == address(this));
        require(_move.mvIdx == lastMove.mvIdx + 1);
        // check if played by proper player (1 because move indexing starts at 1)
        uint8 _playerID = uint8((1 + _move.mvIdx + uint8(firstPlayer)) % 2);
        address _trueSender = sigRecover(abi.encode(_move), _sign);
        require(_trueSender == playerAdd[_playerID]);
        _;
    }

    modifier surrenderHandler(string memory _code, int8 _player) {
        // let's say: empty string code means surrender
        if (bytes(_code).length == 0)
            pay(1 - _player);
        else
            _;
    }

    /**
     * If any move is played (even incorrect) "on top" of last one,
     * that move becames approved and is applied
     * bytes32 _hashPrev: hash of the previous move from the struct of just played.
     */
    modifier approveLast(uint32 _mvIdx, bytes32 _hashPrev) {
        if (_mvIdx > 1) {
            bytes32 _lastHash = keccak256(abi.encode(lastMove));
            require(_lastHash == _hashPrev);
            if (unapplied) {
                // apply previous (it's now signed by both players)
                int8 _winner = game.move(bytes(lastMove.code), lastPlayer);
                if (_winner >= 0)
                    pay(_winner);
                unapplied = false;
            }
        }
        _;
    }

    modifier moveCorrect(string memory _code, int8 _player) {
        require(game.isCorrect(bytes(_code), _player));
        _;
    }

    modifier stakeVerifier() {
        uint8 _senderID = uint8(playerID[msg.sender]);
        require(balance[_senderID] + msg.value >= balance[1 - _senderID]);
        balance[_senderID] += msg.value;
        _;
    }

    /**
     * Propose draw. Popopsal is valid till any other move is played and cannot be withdrawn.
     * int8 _player: ID of poposing player (will be verified).
     * bytes32 _signature: signature of the player.
     */
    function proposeDraw(int8 _player, Signature memory _sign)
        public
    {
        bytes32 hash = keccak256(abi.encode("draw", lastMove));
        require(ecrecover(hash, _sign.v, _sign.r, _sign.s) == playerAdd[uint8(_player)]);
        // set draw proposal or accept opponent's one
        if (drawProposal == -1)
            drawProposal = _player;
        else if (drawProposal == 1-_player)
            pay(2);
    }

    /**
     * Update the game with one more move.
     * Move memory _move: encoded move with addidional info.
     * bytes32 _signature: signature of the player.
     */
    function play(Move memory _move, Signature memory _sign)
        public
        payable
        metadataVerifivation(_move, _sign)
        // WHAT IF I DON'T WANT TO APPROVE LAST?
        approveLast(_move.mvIdx, _move.hashPrev)
        surrenderHandler(_move.code, playerID[msg.sender])
        stakeVerifier()
        moveCorrect(_move.code, playerID[msg.sender])
    {
        // drawProposal is valid only till next move
        drawProposal = -1;
        // set this move as last (for opponent to apptoval)
        lastMove = _move;
        lastPlayer = (1 + int8(_move.mvIdx) + firstPlayer) % 2;
        lastBlockstamp = block.number;
        unapplied = true;
        emit MovePlayed(_move.code, lastPlayer);
    }

    function claimEther()
        public
    {
        int8 _sender = playerID[msg.sender];
        if (lastPlayer == _sender
         && lastBlockstamp != 0
         && lastBlockstamp + patience < block.number) {
            pay(_sender);
        }
    }

    /**
     * Pay the stake to players. All to the winner (except of excess of the one who lost),
     * or each balance to the owner in case of draw.
     * int8 _winner: ID of the winner, or 2 if draw.
     */
    function pay(int8 _winner)
        private
    {
        if (_winner < 2) {
            uint _commonStake = balance[0]<balance[1] ? balance[0] : balance[1];
            balance[uint8(_winner)] += _commonStake;
            balance[uint8(1-_winner)] -= _commonStake;
        }
        for (uint8 i = 0; i < 2; i++)
            if (balance[i] > 0)
                playerAdd[i].transfer(balance[i]);
        if (_winner < 2)
            emit GameFinished(_winner, playerName[uint8(_winner)], balance[uint8(_winner)]);
        else
            emit GameFinished(_winner, "draw", 0);
    }

    /**
     * Initialize a new game.
     * string player0Name: Nickname of the player creating the game.
     * bool startGame: Pass true or false depending on if the creator will start the game.
     */
    function initGame(string memory _player0Name)
        public
        payable
        returns(address)
    {
        game = new GomokuBackend();
        playerAdd[0] = msg.sender;
        playerID[msg.sender] = 0;
        playerName[0] = _player0Name;
        balance[0] = msg.value;
        // firstPlayer = _playFirst ? 0 : 1;
        emit GameInitialized(playerAdd[0], playerName[0], firstPlayer, balance[0]);
        //state = defaultState;
        //GameStateChanged
        return address(this);
    }

    /**
     * Join to the initialized game.
     * string player1Name: Nickname of the player joining the game.
     */
    function joinGame(string memory _player1Name)
        public
        payable
        returns(address)
    {
        // Check that this game does not have a second player yet
        require (playerAdd[1] == address(0));
        // The same player coannot play on both sides
        require (msg.sender != playerAdd[0]);
        require (msg.value >= balance[0]);
        playerAdd[1] = msg.sender;
        playerID[msg.sender] = 1;
        playerName[1] = _player1Name;
        balance[1] = msg.value;
        emit GameJoined(playerAdd[0], playerName[0],
                        playerAdd[1], playerName[1],
                        firstPlayer, balance[1] + balance[0]);
        return address(this);
    }
}

