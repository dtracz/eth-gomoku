export interface Move {
  gameAddress: string;
  mvIdx: number;
  code: string;
  hashPrev: string;
  hashGameState: string;
}

export const MoveType = {
  Move: {
    gameAddress: 'address',
    mvIdx: 'uint32',
    code: 'string',
    hashPrev: 'bytes32',
    hashGameState: 'bytes32'
  }
};
