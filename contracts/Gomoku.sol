pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2; // for passing structs

contract Gomoku {
    Move lastMove;

    struct MoveCode {
        uint8 x;
        uint8 y;
    }

    struct Move {
        address gameAdsress;
        uint32 mvIdx;
        MoveCode moveCode;
        bytes32 hashPrev;
        bytes32 hashGameState;
    }

    function hashMove(Move memory move) pure private returns(bytes32) {
        // ???
        return move.hashPrev;
    }

    function play(Move memory move, bytes32 _signature) public {
        bytes32 lastHash = hashMove(lastMove);
        if (lastHash == move.hashPrev) {
            lastMove = move;
        }
    }
}

