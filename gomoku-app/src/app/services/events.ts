export const eventGameJoined = (err, data) => {
  console.log('Someone joined data:', data);
};

export const eventMovePlayed = (err, data) => {
  console.log('Someone made a move:', data);
};
