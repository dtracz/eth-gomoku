pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2; // for passing structs

contract Gomoku {
    address player0;
    address player1;

    Move lastMove;

    constructor(address _player0, address _player1) public {
        player0 = _player0;
        player1 = _player1;
    }

    modifier playerOnly(uint32 _n) {
        if (_n % 2 == 0)
            require(msg.sender == player0);
        else
            require(msg.sender == player1);
        _;
    }

    struct MoveCode {
        uint8 x;
        uint8 y;
    }

    struct Move {
        address gameAddress;
        uint32 mvIdx;
        MoveCode moveCode;
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

    struct GameState {
        uint32 nMoves;
        int8[19][19] board;
    }

    GameState gameState;
    int8 winning;

    function placePiece(MoveCode memory _moveCode, int8 _player) private {
        require(gameState.board[_moveCode.x][_moveCode.y] == 0);
        require(winning == 0);
        gameState.board[_moveCode.x][_moveCode.y] = _player;
        gameState.nMoves++;
        if (checkWin(_moveCode, _player))
            winning = _player;
    } 

    function checkWin(MoveCode memory _moveCode, int8 _player) private view returns(bool) {
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

