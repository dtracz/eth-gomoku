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
        uint8[19][19] board;
    }

    GameState gameState;

    function placePiece(MoveCode memory _moveCode, uint8 _player) private {
        require(gameState.board[_moveCode.x][_moveCode.y] == 0);
        gameState.board[_moveCode.x][_moveCode.y] = _player;
        gameState.nMoves++;
    } 
}

