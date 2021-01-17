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
        require(_str.length < 256);
        require(_str[i] == '(');
        i++;
        while (i < _str.length - 2 && (uint8(_str[i]) >= 48 || uint8(_str[i]) <= 57)) {
            uint8 d = uint8(_str[i]) - 48; //uint8('0');
            _code.x = 10*_code.x + d;
        } 
        require(_str[i] == ',');
        i++;
        while (i < _str.length - 1 && (uint8(_str[i]) >= 48 || uint8(_str[i]) <= 57)) {
            uint8 d = uint8(_str[i]) - 48; //uint8('0');
            _code.y = 10*_code.y + d;
        } 
        require(_str[i] == ')');
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
    address payable[2] playerAdd;

    GomokuBackend game;
    Move lastMove;
    int8 lastPlayer;

    int8 drawProposal;

    mapping(address => int8) private playerID;

    uint[2] balance;

    modifier playerOnly(uint32 _n) {
        if (_n % 2 == 0)
            require(msg.sender == playerAdd[0]);
        else
            require(msg.sender == playerAdd[1]);
        _;
    }

    modifier surrenderHandler(string memory _code, int8 _player) {
        // let's say: empty string code means surrender
        if (bytes(_code).length == 0)
            pay(1 - _player);
        else
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

    struct Move {
        address gameAddress;
        uint32 mvIdx;
        string code;
        bytes32 hashPrev;
        bytes32 hashGameState;
    }

    /**
     * Propose draw. Popopsal is valid till any other move is played and cannot be withdrawn.
     * int8 _player: ID of poposing player (will be verified).
     * bytes32 _signature: signature of the player.
     */
    function proposeDraw(int8 _player, bytes32 _signature)
        public
    {
        if (drawProposal == 0)
            drawProposal = _player;
        else if (drawProposal != _player)
            pay(-1);
    }

    /**
     * Update the game with one more move.
     * Move memory _move: encoded move with addidional info.
     * bytes32 _signature: signature of the player.
     */
    function play(Move memory _move, bytes32 _signature)
        public
        payable
        playerOnly(_move.mvIdx)
        surrenderHandler(_move.code, playerID[msg.sender])
        moveCorrect(_move.code, playerID[msg.sender])
        stakeVerifier()
    {
        // drawProposal is valid only till next move
        drawProposal = 0;
        // verify if this move follows previous
        bytes32 _lastHash = keccak256(abi.encode(lastMove));
        require(_lastHash == _move.hashPrev);
        // apply previous (it's now signed by both players)
        int8 _winner = game.move(bytes(lastMove.code), lastPlayer);
        if (_winner != 0) {
            pay(_winner);
        } else {
            lastMove = _move;
            lastPlayer = playerID[msg.sender];
        }
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
}

