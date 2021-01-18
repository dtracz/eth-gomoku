pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2; // for passing structs


contract GomokuBackend {
    struct MoveCode {
        uint8 x;
        uint8 y;
    }

    struct GameState {
        uint32 nMoves;
        int8[19][19] board;
    }

    GameState gameState;
    int8 winner;

    /**
     * Translate a string encoded move into a MoveCode.
     * bytes memory _str: move encoded and represented as a string.
     * returns: MoveCode memory _code: move represented as a MoveCode structure.
     */
    function decode(bytes memory _str)
        private
        pure
        returns(MoveCode memory)
    {
        MoveCode memory _code;
        uint8 i = 0;
        require(uint8(_str[i]) == 40); // '('
        i++;
        while (i < _str.length - 2 && (uint8(_str[i]) >= 48 || uint8(_str[i]) <= 57)) {
            uint8 d = uint8(_str[i]) - 48; //uint8('0');
            _code.x = 10*_code.x + d;
        }
        require(uint8(_str[i]) == 44); // ','
        i++;
        while (i < _str.length - 1 && (uint8(_str[i]) >= 48 || uint8(_str[i]) <= 57)) {
            uint8 d = uint8(_str[i]) - 48; //uint8('0');
            _code.y = 10*_code.y + d;
        }
        require(uint8(_str[i]) == 41); // ')'
        i++;
        require(i == _str.length);
        return _code;
    }

    /**
     * Verify if the move is correct. Needs to be called from outside the contract.
     * bytes memory _str: move encoded and represented as a string.
     * int8 _player: ID of the player who played the move.
     * returns: bool: the result.
     */
    function isCorrect(bytes memory _str, int8 _player)
        public
        view
        returns(bool)
    {
        MoveCode memory _code = decode(_str);
        return (gameState.board[_code.x][_code.y] == 0
            && winner == 0);
    }

    /**
     * Apply move to the board.
     * bytes memory _str: move encoded and represented as a string.
     * int8 _player: ID of the player who played the move.
     * returns: int8 _winner: ID of the player who won,
     *                        -1 if draw was acheved or 0 on other case.
     */
    function move(bytes memory _str, int8 _player)
        public
        returns(int8)
    {
        MoveCode memory _code = decode(_str);
        gameState.board[_code.x][_code.y] = _player;
        gameState.nMoves++;
        if (gameState.nMoves >= 19*19)
            winner = -1;
        else if (checkWin(_code, _player))
            winner = _player;
        return winner;
    }

    /**
     * Check if after this move game is at the winning state (exactly 5 stones in line).
     * MoveCode memory _code: code of the last move payed.
     * int8 _player: ID of the player who played the move.
     */
    function checkWin(MoveCode memory _code, int8 _player)
        private
        view
        returns(bool)
    {
        uint8[3][3] memory _sameInDir;
        for (int8 i = -1; i <= 1; i++) {
            for (int8 j = -1; j <= 1; j++) {
                if (i == 0 && j == 0)
                    continue;
                int8 x = int8(_code.x) + i;
                int8 y = int8(_code.y) + j;
                while (0 <= x && x < 19 &&
                       0 <= y && y < 19 &&
                       gameState.board[uint(x)][uint(y)] == _player) {
                    _sameInDir[uint(x+1)][uint(y+1)]++;
                    x += i;
                    y += j;
                }
            }
        }
        return _sameInDir[1][0] + _sameInDir[1][2] == 5  // horizontal
            || _sameInDir[0][1] + _sameInDir[2][1] == 5  // vertical
            || _sameInDir[0][0] + _sameInDir[2][2] == 5  // SW-NE diag
            || _sameInDir[2][0] + _sameInDir[0][2] == 5; // NW-SE diag
    }
}


contract Gomoku {
    address payable[2] public playerAdd;
    mapping(address => int8) public playerID;
    string[2] playerName;
    uint8 firstPlayer; // who starts the game

    GomokuBackend game;
    bool unapplied;
    Move lastMove;
    int8 lastPlayer;  // who played last move

    int8 drawProposal;
    uint[2] balance;

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


    event GameInitialized(address indexed player, string player1Alias,
                          uint8 firstPlayer, uint coins);
    event GameJoined(address indexed player0, string player0Name,
                     address indexed player1, string player1Name,
                     uint8 firstPlayer, uint coins);
    event GameStateChanged(int8[128] state);


    modifier metadataVerifivation(Move memory _move, Signature memory _sign) {
        // verify if move is for this game
        require(_move.gameAddress == address(this));
        // check if played by proper player
        uint8 _playerID = uint8((_move.mvIdx + firstPlayer) % 2);
        if (_playerID == 0)
            require(msg.sender == playerAdd[0]);
        else
            require(msg.sender == playerAdd[1]);
        // verify signature
        bytes32 hash = keccak256(abi.encode(_move));
        require(ecrecover(hash, _sign.v, _sign.r, _sign.s) == playerAdd[_playerID]);
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
    modifier approveLast(bytes32 _hashPrev) {
        // bytes32 _lastHash = keccak256(abi.encode(lastMove));
        // require(_lastHash == _hashPrev);
        if (unapplied) {
            // apply previous (it's now signed by both players)
            int8 _winner = game.move(bytes(lastMove.code), lastPlayer);
            if (_winner != 0)
                pay(_winner);
            unapplied = false;
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
        if (drawProposal == 0)
            drawProposal = _player;
        else if (drawProposal == 1-_player)
            pay(-1);
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
        approveLast(_move.hashPrev)
        surrenderHandler(_move.code, playerID[msg.sender])
        moveCorrect(_move.code, playerID[msg.sender])
        stakeVerifier()
    {
        // drawProposal is valid only till next move
        drawProposal = 0;
        // set this move as last (for opponent to apptoval)
        lastMove = _move;
        lastPlayer = playerID[msg.sender];
        unapplied = true;
    }

    /**
     * Pay the stake to players. All to the winner (except of excess of the one who lost),
     * or each balance to the owner in case of draw.
     * int8 _winner: ID of the winner, or -1 if draw.
     */
    function pay(int8 _winner)
        private
    {
        if (_winner >= 0) {
            uint _commonStake = balance[0]<balance[1] ? balance[0] : balance[1];
            playerAdd[uint8(_winner)].transfer(_commonStake);
            balance[0] -= _commonStake;
            balance[1] -= _commonStake;
        }
        for (uint8 i = 0; i < 2; i++)
            if (balance[i] > 0)
                playerAdd[i].transfer(balance[i]);
    }

    /**
     * Initialize a new game.
     * string player0Name: Nickname of the player creating the game.
     * bool startGame: Pass true or false depending on if the creator will start the game.
     */
    function initGame(string memory _player0Name)
        public
        payable
    {
        playerAdd[0] = msg.sender;
        playerID[msg.sender] = 0;
        playerName[0] = _player0Name;
        balance[0] = msg.value;
        // firstPlayer = _playFirst ? 0 : 1;
        emit GameInitialized(playerAdd[0], playerName[0], firstPlayer, balance[0]);
        //state = defaultState;
        //GameStateChanged
    }

    /**
     * Join to the initialized game.
     * string player1Name: Nickname of the player joining the game.
     */
    function joinGame(string memory _player1Name)
        public
        payable
    {
        // Check that this game does not have a second player yet
        require (playerAdd[1] == address(0));
        require (msg.value >= balance[0]);
        playerAdd[1] = msg.sender;
        playerID[msg.sender] = 1;
        playerName[1] = _player1Name;
        balance[1] = msg.value;
        emit GameJoined(playerAdd[0], playerName[0],
                        playerAdd[1], playerName[1],
                        firstPlayer, balance[1] + balance[0]);
    }
}

