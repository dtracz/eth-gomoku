export const eventGameJoined = (err, message) => {
  console.log('Someone joined data:', message);
};

export const eventMovePlayed = (err, message) => {
  console.log('Someone made a move:', message);
};
