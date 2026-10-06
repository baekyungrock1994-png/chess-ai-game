// 체스 기물 기본 설정 및 초기 템플릿 (더미 봇 제거됨)

export const DEFAULT_PIECE_SETTINGS = {
  pawn: { weight: 100, aggression: 60, role: 'breakthrough', label: '폰 (Pawn)' },
  knight: { weight: 320, aggression: 75, role: 'fork_hunter', label: '나이트 (Knight)' },
  bishop: { weight: 330, aggression: 65, role: 'sniper', label: '비숍 (Bishop)' },
  rook: { weight: 500, aggression: 55, role: 'open_file', label: '룩 (Rook)' },
  queen: { weight: 950, aggression: 80, role: 'striker', label: '퀸 (Queen)' },
  king: { weight: 20000, aggression: 20, role: 'castle_bunker', label: '킹 (King)' },
};

export const DEFAULT_BOT_CONFIG = {
  id: '',
  name: '나의 체스 AI',
  creator: '',
  avatar: '⚔️',
  title: '체스 전략가',
  description: '직접 설계한 전략과 프롬프트로 움직이는 체스 AI',
  // 100포인트 스탯 분배 (총합 100)
  stats: {
    attack: 30,
    defense: 30,
    control: 25,
    mobility: 15
  },
  pieceSettings: { ...DEFAULT_PIECE_SETTINGS },
  phases: {
    opening: {
      primaryGoal: 'center_control',
      prompt: '초반 폰을 중앙에 배치하고 빠르게 마이너 기물을 전개하여 캐슬링을 준비하라.'
    },
    middlegame: {
      strategy: 'tactical_assault',
      prompt: '나이트와 비숍의 협공으로 핀과 포크를 노리고, 기회가 오면 상대 킹을 향해 전면 공격하라.'
    },
    endgame: {
      victoryPlan: 'pawn_promotion',
      prompt: '아군 폰을 호위하여 빠르게 퀸으로 승급시키고 확실한 체크메이트를 완성하라.'
    }
  },
  signatureTactic: 'fork_master',
  riskTolerance: 40,
  persona: {
    trait: 'confident',
    dialogues: {
      matchStart: '멋진 승부를 겨뤄보자!',
      onCapture: '계획대로 기물을 낚아챘다!',
      onCheck: '체크! 슬슬 판이 기울기 시작하는군.',
      onVictory: '체크메이트! 완벽한 전략의 승리다.',
      onCrisis: '흠, 조금 까다로운 수지만 역전해보이겠어!'
    }
  }
};

// 더미 봇 데이터는 모두 제거되었습니다. 실제 등록된 학생들의 봇 데이터만 사용됩니다.
export const PRESET_BOTS = [];
