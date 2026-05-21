# D'ARC RAIDERS Future Systems Notes

These systems are planned hooks, not Layer 1 implementation scope.

## Progression

- Skill Tree: passive bonuses should be able to modify movement, healing, crafting, weapon handling, tactical tools, contracts, and loot rewards.
- Class System: starter class set should include Raider, Scout, Medic, Engineer, and Bruiser.
- Weapon Mastery: track weapon use over time and unlock handling bonuses, cosmetics, and attachment tuning.
- Expanded Modding: deeper weapon parts, rarity tiers, durability tradeoffs, and specialized ammo should build on the existing attachment/stat modifier path.

## Class Hooks

- Raider: loot carrying, contract rewards, extraction speed.
- Scout: sprint, traversal, stealth, scanner tools.
- Medic: healing speed, medkit efficiency, revive support.
- Engineer: crafting costs, repair quality, tactical tool battery, deployables.
- Bruiser: armor durability, stagger resistance, melee damage.

## Architecture Guardrail

Future class, skill, and perk bonuses should be applied as additive modifiers around existing systems instead of hard-coded branches inside movement, combat, inventory, crafting, vendors, or contracts.
