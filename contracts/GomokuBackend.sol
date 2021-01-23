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
        while (i < _str.length - 2 && uint8(_str[i]) >= 48 && uint8(_str[i]) <= 57) {
            uint8 d = uint8(_str[i]) - 48; //uint8('0');
            _code.x = 10*_code.x + d;
            i++;
        }
        require(uint8(_str[i]) == 44); // ','
        i++;
        while (i < _str.length - 1 && uint8(_str[i]) >= 48 && uint8(_str[i]) <= 57) {
            uint8 d = uint8(_str[i]) - 48; //uint8('0');
            _code.y = 10*_code.y + d;
            i++;
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

