import {FieldColour} from './field-colour';
import {Move} from './move';
import {MessageType} from './message-type';

export interface Message {
  type: MessageType;
  move: [number, number];
  moveStruct: Move;
  playerColour: FieldColour;
}
