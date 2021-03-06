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

    struct Special {
        address gameAddress;
        bytes32 hashPrev;
        string code;
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
    event DrawProposal(string player, uint32 lastMove);


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

    modifier verifySignature(Move memory _move, Signature memory _sign) {
        require(_move.gameAddress == address(this));
        uint8 _playerID = uint8((1 + _move.mvIdx + uint8(firstPlayer)) % 2);
        address _trueSender = sigRecover(abi.encode(_move), _sign);
        require(_trueSender == playerAdd[_playerID]);
        _;
    }

    modifier verifyOrder(Move memory _prev, Move memory _move) {
        require(_move.mvIdx == _prev.mvIdx + 1);
        if (_move.mvIdx > 1) {
            bytes32 _hashPrev = keccak256(abi.encode(_prev));
            require(_move.hashPrev == _hashPrev);
        }
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
     * that move becomes approved and is applied
     * bytes32 _hashPrev: hash of the previous move from the struct of just played.
     */
    function approveLast()
        private
    {
        if (unapplied) {
            // apply previous (it's now signed by both players)
            int8 _winner = game.move(bytes(lastMove.code), lastPlayer);
            if (_winner >= 0)
                pay(_winner);
            unapplied = false;
        }
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
     * Propose draw. Proposal is valid till any other move is played and cannot be withdrawn.
     * Special _proposal: special struct for coding and signing valid special actions.
     * bytes32 _signature: signature of the player.
     */
    function proposeDraw(Special memory _proposal, Signature memory _sign)
        public
        payable
    {
        address _trueSender = sigRecover(abi.encode(_proposal), _sign);
        require(_trueSender == playerAdd[0] || _trueSender == playerAdd[1]);
        int8 _playerID = playerID[_trueSender];

        require(_proposal.gameAddress == address(this));
        require(_proposal.hashPrev == keccak256(abi.encode(lastMove)));
        require(keccak256(bytes(_proposal.code)) == keccak256(bytes("draw")));

        emit DrawProposal(playerName[uint8(_playerID)], lastMove.mvIdx);
        if (drawProposal == -1)
            drawProposal = _playerID;
        else if (drawProposal == 1-_playerID)
            pay(2);
    }

    /**
     * Update the game with one more move.
     * Move memory _move: encoded move with additional info.
     * bytes32 _signature: signature of the player.
     */
    function play(Move memory _move, Signature memory _sign)
        public
        payable
        verifySignature(_move, _sign)
        verifyOrder(lastMove, _move)
        surrenderHandler(_move.code, int8(1 + _move.mvIdx + uint8(firstPlayer)) % 2)
        stakeVerifier()
    {
        approveLast();
        require(game.isCorrect(bytes(_move.code), playerID[msg.sender]));
        // drawProposal is valid only till next move
        drawProposal = -1;
        // set this move as last (for opponent to approval)
        lastMove = _move;
        lastPlayer = (1 + int8(_move.mvIdx) + firstPlayer) % 2;
        lastBlockstamp = block.number;
        unapplied = true;
        emit MovePlayed(_move.code, lastPlayer);
    }

    function replaceLast(Move memory _newLast, Signature memory _sigNewLast,
                         Move memory _next, Signature memory _sigNext)
        private
        verifySignature(_newLast, _sigNewLast)
        verifySignature(_next, _sigNext)
        verifyOrder(_newLast, _next)
    {
        require(_newLast.hashPrev == lastMove.hashPrev);
        lastMove = _newLast;
    }

    function register(uint32 _nMoves, Move[] memory _moves, Signature[] memory _signs)
        public
        payable
    {
        require(_nMoves >= 1);
        uint32 _idx;
        // skip moves until last
        for (uint32 i = 0; i < _nMoves; i++) {
            if (_moves[i].mvIdx >= lastMove.mvIdx) {
                _idx = i;
                break;
            }
        }
        if (_moves[_idx].mvIdx == lastMove.mvIdx) {
           // if last move is to be replaced
            if (keccak256(abi.encode(_moves[_idx])) != keccak256(abi.encode(lastMove))) {
                // require longer move chain
                require(_nMoves > _idx + 1);
                replaceLast(_moves[_idx], _signs[_idx], _moves[_idx+1], _signs[_idx+1]);
            }
            _idx++;
        }
        while (_idx < _nMoves) {
            play(_moves[_idx], _signs[_idx]);
            _idx++;
        }
    }

    function claimEther()
        public
        payable
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
        // should be no eth on the constract at this point
        selfdestruct(msg.sender);
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
        // The same player cannot play on both sides
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

