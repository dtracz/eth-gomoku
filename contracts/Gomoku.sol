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

    modifier isMoveCorrect(MoveCode memory _moveCode, int8 _player) {
        require(gameState.board[_moveCode.x][_moveCode.y] == 0);
        require(winning == 0);
        _;
    }

    function placePiece(MoveCode memory _moveCode, int8 _player)
        internal
        isMoveCorrect(_moveCode, _player)
        returns(int8)
    {
        gameState.board[_moveCode.x][_moveCode.y] = _player;
        gameState.nMoves++;
        if (checkWin(_moveCode, _player))
            winning = _player;
        return _player;
    } 

    function checkWin(MoveCode memory _moveCode, int8 _player)
        private
        view
        returns(bool)
    {
        uint8[3][3] memory _sameInDir;
        for (int8 i = -1; i <= 1; i++) {
            for (int8 j = -1; j <= 1; j++) {
                if (i == 0 && j == 0)
                    continue;
                int8 x = int8(_moveCode.x) + i;
                int8 y = int8(_moveCode.y) + j;
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

    GomokuBackend backend;
    Move lastMove;

    modifier playerOnly(uint32 _n) {
        if (_n % 2 == 0)
            require(msg.sender == player0);
        else
            require(msg.sender == player1);
        _;
    }

    struct Move {
        address gameAddress;
        uint32 mvIdx;
        GomokuBackend.MoveCode moveCode;
        bytes32 hashPrev;
        bytes32 hashGameState;
    }

    function hashMove(Move memory move) pure private returns (bytes32) {
        // ???
        return move.hashPrev;
    }

    function play(Move memory move, bytes32 _signature) public playerOnly(move.mvIdx) {
        bytes32 lastHash = hashMove(lastMove);
        if (lastHash == move.hashPrev) {
            lastMove = move;
        }
    }
}

