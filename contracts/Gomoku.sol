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

    function isCorrect(MoveCode memory _code, int8 _player)
        public
        view
        returns(bool)
    {
        return (gameState.board[_code.x][_code.y] == 0
            && winning == 0);
    }

    function move(MoveCode memory _code, int8 _player)
        public
        returns(int8)
    {
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

    GomokuBackend game;
    Move lastMove;
    int8 lastPlayer;

    mapping(address => int8) private players;

    modifier playerOnly(uint32 _n) {
        if (_n % 2 == 0)
            require(msg.sender == player0);
        else
            require(msg.sender == player1);
        _;
    }

    modifier moveCorrect(GomokuBackend.MoveCode memory _code, int8 _player) {
        require(game.isCorrect(_code, _player));
        _;
    } 

    struct Move {
        address gameAddress;
        uint32 mvIdx;
        GomokuBackend.MoveCode code;
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
        int8 _winner = game.move(lastMove.code, lastPlayer);
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
}

