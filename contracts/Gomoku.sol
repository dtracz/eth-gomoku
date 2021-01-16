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
    int8 winning;

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

    function isCorrect(bytes memory _str, int8 _player)
        public
        view
        returns(bool)
    {
        MoveCode memory _code = decode(_str);
        return (gameState.board[_code.x][_code.y] == 0
            && winning == 0);
    }

    function move(bytes memory _str, int8 _player)
        public
        returns(int8)
    {
        MoveCode memory _code = decode(_str);
        gameState.board[_code.x][_code.y] = _player;
        gameState.nMoves++;
        if (checkWin(_code, _player))
            winning = _player;
        return _player;
    }

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
    address player0;
    address player1;
    string player0Name;
    string player1Name;
    address nextPlayer;
    address winner;
    bool ended;
    uint pot; // What this game is worth: ether paid into the game

    GomokuBackend game;
    Move lastMove;
    int8 lastPlayer;

    mapping(address => int8) private players;

    event GameInitialized(address indexed player0, string player1Alias, address playerWhite, uint pot);
    event GameJoined(address indexed player0, string player0Name, address indexed player1, string player1Name, address playerWhite, uint pot);
    event GameStateChanged(int8[128] state);
    //event Move(address indexed player, uint256 fromIndex, uint256 toIndex);

    modifier playerOnly(uint32 _n) {
        if (_n % 2 == 0)
            require(msg.sender == player0);
        else
            require(msg.sender == player1);
        _;
    }

    modifier moveCorrect(string memory _code, int8 _player) {
        require(game.isCorrect(bytes(_code), _player));
        _;
    }

    struct Move {
        address gameAddress;
        uint32 mvIdx;
        string code;
        bytes32 hashPrev;
        bytes32 hashGameState;
    }

    function play(Move memory _move, bytes32 _signature)
        public
        playerOnly(_move.mvIdx)
        moveCorrect(_move.code, players[msg.sender])
    {
        bytes32 _lastHash = keccak256(abi.encode(lastMove));
        require(_lastHash == _move.hashPrev);
        int8 _winner = game.move(bytes(lastMove.code), lastPlayer);
        if (_winner != 0) {
            pay(_winner);
        } else {
            lastMove = _move;
            lastPlayer = players[msg.sender];
        }
    }

    function pay(int8 player)
        private
    {
        // ...
    }

    /**
     * Initialize a new game
     * string player1Alias: Alias of the player creating the game
     * bool playAsWhite: Pass true or false depending on if the creator will play as white
     */
    function initGame(string player0Name, bool playAsWhite) public {

        ended = false;

        // Initialize participants
        player0 = msg.sender;
        player0Name = player0Name;

        // Initialize game value
        pot = msg.value * 2;

        //state = defaultState;

        if (playAsWhite) {
            // Player 1 will play as white
            playerWhite = msg.sender;

            // Game starts with White, so here player 1
            nextPlayer = player0;
        }

        // Sent notification events
        GameInitialized(player0, player0Name, playerWhite, pot);
        GameStateChanged(fields);
    }

    /**
     * Join an initialized game
     * bytes32 gameId: ID of the game to join
     * string player2Alias: Alias of the player that is joining
     */
    function joinGame(string player1Name) public {
        // Check that this game does not have a second player yet
        if (player1 != 0) {
            throw;
        }

        // throw if the second player did not match the bet.
        if (msg.value != pot) {
            throw;
        }
        pot += msg.value;

        player1 = msg.sender;
        player1Name = player1Name;


        // If the other player isn't white, player1 will play as white
        if (playerWhite == 0) {
            playerWhite = msg.sender;
            // Game starts with White, so here player1
            nextPlayer = player1;
        }

        GameJoined(player0, player0Name, player1, player1Name, playerWhite, pot);
    }
}

