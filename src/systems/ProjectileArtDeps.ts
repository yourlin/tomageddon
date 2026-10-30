import rows from '../data/projectileArt.generated.json';

/** 当前波可能发射的弹体：通用技能/减速/反伤、装备武器及本波敌人。 */
export function projectileArtDeps(weapons: readonly string[], enemies: readonly string[]): Set<string> {
  const owned = new Set(weapons);
  const owners = new Set(enemies);
  const common = new Set(['proj_player', 'proj_enemy', 'proj_pea', 'proj_coin', 'proj_rocket', 'proj_ice']);
  return new Set(
    rows
      .filter(
        (row) =>
          (row.id.startsWith('legacy_') && common.has(row.key)) ||
          row.id === 'player_star_anise_shuriken' ||
          (row.id.startsWith('player_') && owned.has(row.id.slice(7))) ||
          (row.id.startsWith('mine_') && owned.has(row.id.slice(5))) ||
          (row.id.startsWith('enemy_') && owners.has(row.id.slice(6))),
      )
      .map((row) => row.id),
  );
}
