const rollTactics = (commanderSkill: number): number => {

  let die1 = 0;
  let die2 = 0;
  let die3 = 0;
  let die4 = 0;
  let roll = 0;
  let sortedRolls: number[] = [];
  let lowestRolls: number[] = [];
  let bestRolls: number[] = [];

  switch (commanderSkill) {
    case 1:
      die1 = Math.floor(Math.random() * 6) + 1;
      die2 = Math.floor(Math.random() * 6) + 1;
      die3 = Math.floor(Math.random() * 6) + 1;

      sortedRolls = [die1, die2, die3].sort((a, b) => a - b);
      lowestRolls = sortedRolls.slice(0, 2);
      roll = lowestRolls[0] + lowestRolls[1];
      return 1 + (1/18 * roll);
    case 2:
      die1 = Math.floor(Math.random() * 6) + 1;
      die2 = Math.floor(Math.random() * 6) + 1;

      roll = die1 + die2;
      return 1 + (1/18 * roll);
    case 3:
      die1 = Math.floor(Math.random() * 6) + 1;
      die2 = Math.floor(Math.random() * 6) + 1;
      die3 = Math.floor(Math.random() * 6) + 1;

      sortedRolls = [die1, die2, die3].sort((a, b) => a - b);
      bestRolls = sortedRolls.slice(1, 3);
      roll = bestRolls[0] + bestRolls[1];
      return 1 + (1/18 * roll);
    case 4:
      die1 = Math.floor(Math.random() * 6) + 1;
      die2 = Math.floor(Math.random() * 6) + 1;
      die3 = Math.floor(Math.random() * 6) + 1;
      die4 = Math.floor(Math.random() * 6) + 1;

      sortedRolls = [die1, die2, die3, die4].sort((a, b) => a - b);
      bestRolls = sortedRolls.slice(2, 4);
      roll = bestRolls[0] + bestRolls[1];
      return 1 + (1/18 * roll);
    case 5:
      die1 = Math.floor(Math.random() * 6) + 1;
      die2 = Math.floor(Math.random() * 6) + 1;
      die3 = Math.floor(Math.random() * 8) + 1;
      die4 = Math.floor(Math.random() * 8) + 1;

      sortedRolls = [die1, die2, die3, die4].sort((a, b) => a - b);
      bestRolls = sortedRolls.slice(2, 4);
      roll = bestRolls[0] + bestRolls[1];
      return 1 + (1/18 * roll);
    default:
      return 1;
  }
};

export default rollTactics;