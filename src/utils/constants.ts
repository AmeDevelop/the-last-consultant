import type { ItemDef, SkillDef } from '../types'

export const ITEMS: Record<string, ItemDef> = {
  energy_drink: {
    id: 'energy_drink',
    name: 'エナジードリンク',
    description: 'HP30回復',
    effect: 'hp',
    value: 30,
  },
  protein: {
    id: 'protein',
    name: 'プロテイン',
    description: '戦闘中ちから+10（一時的）',
    effect: 'stat_temp',
    value: 10,
    stat: 'chikara',
  },
  strategy_book: {
    id: 'strategy_book',
    name: '戦略フレームワーク集',
    description: '戦闘中かしこさ+10（一時的）',
    effect: 'stat_temp',
    value: 10,
    stat: 'kashikosa',
  },
  chatgpt_spellbook: {
    id: 'chatgpt_spellbook',
    name: 'ChatGPTの呪文書',
    description: 'MP全回復',
    effect: 'mp',
    value: 9999,
  },
  power_cord: {
    id: 'power_cord',
    name: '電源コード（大）',
    description: 'Badルート専用アイテム',
    effect: 'hp',
    value: 0,
  },
}

export const SKILLS: Record<string, SkillDef> = {
  logic_tree: {
    id: 'logic_tree',
    name: 'ロジックツリー',
    description: 'HP30回復・デバフ解除',
    mpCost: 10,
    effect: 'heal_hp',
    value: 30,
  },
  swot_analysis: {
    id: 'swot_analysis',
    name: 'SWOT分析',
    description: '次の攻撃がクリティカル確定',
    mpCost: 15,
    effect: 'buff',
    value: 2,
  },
  prompt_jutsu: {
    id: 'prompt_jutsu',
    name: 'プロンプト術',
    description: 'かしこさ依存の魔法ダメージ',
    mpCost: 20,
    effect: 'damage',
    value: 40,
    stat: 'kashikosa',
  },
  data_punch: {
    id: 'data_punch',
    name: 'データパンチ',
    description: 'ちから依存の高威力攻撃',
    mpCost: 0,
    effect: 'damage',
    value: 35,
    stat: 'chikara',
  },
  stakeholder_negotiation: {
    id: 'stakeholder_negotiation',
    name: 'ステークホルダー交渉',
    description: '共感力依存・戦闘終了チャンス',
    mpCost: 15,
    effect: 'negotiate',
    value: 0,
    stat: 'kyokan',
  },
  monster_tamer: {
    id: 'monster_tamer',
    name: '魔物使いスキル',
    description: 'True Endingで自動発動',
    mpCost: 0,
    effect: 'special',
    value: 0,
  },
}

export const ITEM_NAMES: Record<string, string> = Object.fromEntries(
  Object.entries(ITEMS).map(([k, v]) => [k, v.name])
)

export const SKILL_NAMES: Record<string, string> = Object.fromEntries(
  Object.entries(SKILLS).map(([k, v]) => [k, v.name])
)

export const PARTY_NAMES: Record<string, string> = {
  ryu: 'Ryu（魔物使い）',
}

export const STAT_LABELS: Record<string, string> = {
  kashikosa: 'かしこさ',
  chikara: 'ちから',
  kyokan: '共感力',
  tekio: '適応力',
}
