export const eventGameJoined = function (err, data) {
  console.log("Someone joined data:", data);
  //enable board
};

export const eventMovePlayed = function (err, data) {
  console.log("Someone made a move:", data);
  //enable board
  const args = status['logs'][0]['args'];
  console.log("received args:", args);
  //TODO pass args.move to gameComponents.hisMove
};
