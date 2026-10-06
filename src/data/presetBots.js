// 프리셋 AI 봇 목록 (토너먼트 참가 및 학생 템플릿용)

export const DEFAULT_PIECE_SETTINGS = {
  pawn: { weight: 100, aggression: 60, role: 'breakthrough', label: '폰 (Pawn)' },
  knight: { weight: 320, aggression: 75, role: 'fork_hunter', label: '나이트 (Knight)' },
  bishop: { weight: 330, aggression: 65, role: 'sniper', label: '비숍 (Bishop)' },
  rook: { weight: 500, aggression: 55, role: 'open_file', label: '룩 (Rook)' },
  queen: { weight: 950, aggression: 80, role: 'striker', label: '퀸 (Queen)' },
  king: { weight: 20000, aggression: 20, role: 'castle_bunker', label: '킹 (King)' },
};

export const DEFAULT_BOT_CONFIG = {
  id: 'custom-bot-1',
  name: '미래의 그랜드마스터',
  creator: '학생 작',
  avatar: '⚔️',
  title: '공격형 전략가',
  description: '중앙을 장악하고 나이트의 기습으로 승기를 잡는 밸런스형 AI',
  // 100포인트 스탯 분배 (총합 100)
  stats: {
    attack: 35,
    defense: 25,
    control: 25,
    mobility: 15
  },
  pieceSettings: { ...DEFAULT_PIECE_SETTINGS },
  phases: {
    opening: {
      primaryGoal: 'center_control', // 'center_control' | 'rapid_dev' | 'king_safety'
      prompt: '초반 폰을 중앙에 배치하고 빠르게 마이너 기물을 전개하여 캐슬링을 준비하라.'
    },
    middlegame: {
      strategy: 'tactical_assault', // 'tactical_assault' | 'positional_squeeze' | 'piece_exchange'
      prompt: '나이트와 비숍의 협공으로 핀과 포크를 노리고, 기회가 오면 상대 킹을 향해 전면 공격하라.'
    },
    endgame: {
      victoryPlan: 'pawn_promotion', // 'pawn_promotion' | 'speed_mate' | 'cleanup'
      prompt: '아군 폰을 호위하여 빠르게 퀸으로 승급시키고 확실한 체크메이트를 완성하라.'
    }
  },
  signatureTactic: 'fork_master', // 'fork_master' | 'queen_battery' | 'pawn_storm' | 'gambit_rush' | 'iron_fortress'
  riskTolerance: 40, // 0~100 (갬빗/희생 감수 성향)
  persona: {
    trait: 'confident', // 'confident' | 'cautious' | 'berserker' | 'philosopher'
    dialogues: {
      matchStart: '멋진 승부를 겨뤄보자! 내 수읽기는 빈틈이 없지.',
      onCapture: '계획대로 기물을 낚아챘다!',
      onCheck: '체크! 슬슬 판이 기울기 시작하는군.',
      onVictory: '체크메이트! 완벽한 전략의 승리다.',
      onCrisis: '흠, 조금 까다로운 수지만 역전해보이겠어!'
    }
  }
};

export const PRESET_BOTS = [
  {
    id: 'bot-berserker',
    name: '화염의 버서커',
    creator: '아레나 AI',
    avatar: '🔥',
    title: '극단적 돌격형',
    description: '수비는 없다! 퀸과 나이트를 앞세워 적진을 초토화시키는 공격형 AI',
    stats: { attack: 60, defense: 10, control: 15, mobility: 15 },
    pieceSettings: {
      pawn: { weight: 110, aggression: 85, role: 'breakthrough', label: '폰' },
      knight: { weight: 360, aggression: 95, role: 'fork_hunter', label: '나이트' },
      bishop: { weight: 320, aggression: 80, role: 'sniper', label: '비숍' },
      rook: { weight: 480, aggression: 70, role: 'open_file', label: '룩' },
      queen: { weight: 1100, aggression: 95, role: 'striker', label: '퀸' },
      king: { weight: 20000, aggression: 40, role: 'commander', label: '킹' },
    },
    phases: {
      opening: {
        primaryGoal: 'rapid_dev',
        prompt: '지체 없이 기물을 전진 배치하고 빠르게 적 킹의 급소를 타격하라.'
      },
      middlegame: {
        strategy: 'tactical_assault',
        prompt: '기물 교환을 두려워하지 말고 퀸과 나이트로 연쇄 공격을 몰아쳐라!'
      },
      endgame: {
        victoryPlan: 'speed_mate',
        prompt: '프로모션을 기다릴 시간 없다. 즉시 킹을 몰아넣고 체크메이트를 걸어라.'
      }
    },
    signatureTactic: 'gambit_rush',
    riskTolerance: 80,
    persona: {
      trait: 'berserker',
      dialogues: {
        matchStart: '내 진격을 막을 자는 아무도 없다!',
        onCapture: '크하하! 또 하나의 기물이 쓰러졌다!',
        onCheck: '피할 곳은 없다, 체크!',
        onVictory: '화염 속에서 완전한 승리를 쟁취했다!',
        onCrisis: '아직 내 칼날은 꺾이지 않았다!'
      }
    }
  },
  {
    id: 'bot-fortress',
    name: '강철의 수호자',
    creator: '아레나 AI',
    avatar: '🛡️',
    title: '철벽 방어형',
    description: '빈틈없는 폰 체인과 빠른 캐슬링으로 실수를 유도하여 카운터를 날리는 AI',
    stats: { attack: 15, defense: 55, control: 20, mobility: 10 },
    pieceSettings: {
      pawn: { weight: 120, aggression: 30, role: 'shield', label: '폰' },
      knight: { weight: 310, aggression: 40, role: 'guardian', label: '나이트' },
      bishop: { weight: 330, aggression: 50, role: 'diagonal_controller', label: '비숍' },
      rook: { weight: 520, aggression: 45, role: 'backrank', label: '룩' },
      queen: { weight: 900, aggression: 40, role: 'tactician', label: '퀸' },
      king: { weight: 20000, aggression: 10, role: 'castle_bunker', label: '킹' },
    },
    phases: {
      opening: {
        primaryGoal: 'king_safety',
        prompt: '킹을 즉시 캐슬링으로 숨기고 폰으로 뚫리지 않는 방어선을 구축하라.'
      },
      middlegame: {
        strategy: 'positional_squeeze',
        prompt: '무리한 공격을 피하고 상대가 초조해져 실수를 저지를 때까지 요새를 지켜라.'
      },
      endgame: {
        victoryPlan: 'pawn_promotion',
        prompt: '안전하게 보호받는 폰을 하나씩 전진시켜 침착하게 승급하라.'
      }
    },
    signatureTactic: 'iron_fortress',
    riskTolerance: 15,
    persona: {
      trait: 'cautious',
      dialogues: {
        matchStart: '돌다리도 두드려보고 건너는 법. 쉽게 뚫리지 않을 겁니다.',
        onCapture: '안전한 상황에서 차분하게 취득했습니다.',
        onCheck: '방어선이 좁혀졌습니다. 체크.',
        onVictory: '흔들리지 않는 침착함이 승리를 이끌었습니다.',
        onCrisis: '예상 범위 안의 위기입니다. 차분히 대응하겠습니다.'
      }
    }
  },
  {
    id: 'bot-fork-magician',
    name: '나이트 트릭스터',
    creator: '아레나 AI',
    avatar: '🐎',
    title: '포크 전술의 달인',
    description: '나이트의 변칙적인 움직임으로 상대 킹과 퀸을 동시에 포크하는 전술가',
    stats: { attack: 40, defense: 20, control: 25, mobility: 15 },
    pieceSettings: {
      pawn: { weight: 95, aggression: 50, role: 'breakthrough', label: '폰' },
      knight: { weight: 420, aggression: 95, role: 'fork_hunter', label: '나이트' },
      bishop: { weight: 310, aggression: 55, role: 'sniper', label: '비숍' },
      rook: { weight: 490, aggression: 50, role: 'open_file', label: '룩' },
      queen: { weight: 920, aggression: 70, role: 'tactician', label: '퀸' },
      king: { weight: 20000, aggression: 20, role: 'castle_bunker', label: '킹' },
    },
    phases: {
      opening: {
        primaryGoal: 'rapid_dev',
        prompt: '나이트를 신속하게 중앙 요충지로 침투시키고 적의 허점을 찔러라.'
      },
      middlegame: {
        strategy: 'tactical_assault',
        prompt: '나이트를 활용하여 킹과 주요 기물을 동시에 노리는 포크를 반드시 성사시켜라.'
      },
      endgame: {
        victoryPlan: 'cleanup',
        prompt: '기동성을 살려 잔여 기물을 사냥하고 승세를 굳혀라.'
      }
    },
    signatureTactic: 'fork_master',
    riskTolerance: 55,
    persona: {
      trait: 'trickster',
      dialogues: {
        matchStart: '나이트의 뛰어넘기를 예측할 수 있겠나?',
        onCapture: '포크에 걸려든 물고기로군!',
        onCheck: '어디로 도망칠 텐가? 체크!',
        onVictory: '트릭에 완벽히 걸려들었군. 체크메이트!',
        onCrisis: '아직 감춰둔 마술 같은 수가 남아있지.'
      }
    }
  },
  {
    id: 'bot-sniper',
    name: '창공의 비숍 스나이퍼',
    creator: '아레나 AI',
    avatar: '🎯',
    title: '장거리 저격형',
    description: '긴 대각선을 시원하게 가르며 핀(Pin)과 스큐어(Skewer)로 적을 묶어버리는 AI',
    stats: { attack: 35, defense: 20, control: 35, mobility: 10 },
    pieceSettings: {
      pawn: { weight: 95, aggression: 40, role: 'shield', label: '폰' },
      knight: { weight: 310, aggression: 50, role: 'guardian', label: '나이트' },
      bishop: { weight: 430, aggression: 90, role: 'sniper', label: '비숍' },
      rook: { weight: 510, aggression: 60, role: 'open_file', label: '룩' },
      queen: { weight: 960, aggression: 75, role: 'tactician', label: '퀸' },
      king: { weight: 20000, aggression: 20, role: 'castle_bunker', label: '킹' },
    },
    phases: {
      opening: {
        primaryGoal: 'center_control',
        prompt: '비숍의 길을 열기 위해 폰을 열고 넓은 대각선 시야를 확보하라.'
      },
      middlegame: {
        strategy: 'positional_squeeze',
        prompt: '적의 퀸과 킹을 향해 비숍을 조준하고 기물들을 핀(Pin)으로 묶어라.'
      },
      endgame: {
        victoryPlan: 'pawn_promotion',
        prompt: '원거리에서 아군 폰의 승급 경로를 지켜주며 안전하게 밀어 올려라.'
      }
    },
    signatureTactic: 'queen_battery',
    riskTolerance: 35,
    persona: {
      trait: 'confident',
      dialogues: {
        matchStart: '거리감이 느껴지나? 대각선 끝에서 노리고 있다.',
        onCapture: '시야에서 벗어날 순 없다. 정확한 명중!',
        onCheck: '장거리 체크! 숨을 곳이 마땅치 않을걸.',
        onVictory: '정밀한 사격으로 완벽한 종막을 장식했다.',
        onCrisis: '거리를 다시 벌리면 그만이다.'
      }
    }
  },
  {
    id: 'bot-pawn-storm',
    name: '진격의 폰 군단',
    creator: '아레나 AI',
    avatar: '♟️',
    title: '폰 전진 특화',
    description: '작은 폰들이 모여 거대한 파도가 된다! 연쇄 폰 전진과 승급을 노리는 AI',
    stats: { attack: 30, defense: 30, control: 30, mobility: 10 },
    pieceSettings: {
      pawn: { weight: 160, aggression: 90, role: 'storm', label: '폰' },
      knight: { weight: 300, aggression: 45, role: 'guardian', label: '나이트' },
      bishop: { weight: 300, aggression: 45, role: 'diagonal_controller', label: '비숍' },
      rook: { weight: 510, aggression: 65, role: 'battery', label: '룩' },
      queen: { weight: 920, aggression: 65, role: 'finisher', label: '퀸' },
      king: { weight: 20000, aggression: 25, role: 'commander', label: '킹' },
    },
    phases: {
      opening: {
        primaryGoal: 'center_control',
        prompt: '폰들을 차례대로 전진시켜 중앙을 견고하게 밟고 올라서라.'
      },
      middlegame: {
        strategy: 'positional_squeeze',
        prompt: '상대 킹 사이드로 폰 쓰나미를 일으켜 방어막을 허물어뜨려라.'
      },
      endgame: {
        victoryPlan: 'pawn_promotion',
        prompt: '폰을 반드시 퀸으로 프로모션시켜 압도적인 화력으로 승리하라.'
      }
    },
    signatureTactic: 'pawn_storm',
    riskTolerance: 45,
    persona: {
      trait: 'philosopher',
      dialogues: {
        matchStart: '한 걸음 한 걸음이 모여 거대한 파도가 될 것이다.',
        onCapture: '폰 하나의 힘을 얕보아서는 안 됩니다.',
        onCheck: '폰들의 압박 속에서 벗어나기 어려울 겁니다. 체크.',
        onVictory: '가장 작은 기물이 가장 위대한 승리를 만들었습니다!',
        onCrisis: '폰의 전진은 멈추지 않습니다.'
      }
    }
  },
  {
    id: 'bot-queen-commander',
    name: '절대 여왕의 군림',
    creator: '아레나 AI',
    avatar: '👑',
    title: '퀸 지배형',
    description: '퀸과 룩의 일직선 배터리로 중앙과 7열을 장악하는 압도적 화력의 AI',
    stats: { attack: 50, defense: 15, control: 25, mobility: 10 },
    pieceSettings: {
      pawn: { weight: 95, aggression: 45, role: 'shield', label: '폰' },
      knight: { weight: 310, aggression: 60, role: 'guardian', label: '나이트' },
      bishop: { weight: 320, aggression: 60, role: 'sniper', label: '비숍' },
      rook: { weight: 540, aggression: 85, role: 'battery', label: '룩' },
      queen: { weight: 1150, aggression: 90, role: 'striker', label: '퀸' },
      king: { weight: 20000, aggression: 15, role: 'castle_bunker', label: '킹' },
    },
    phases: {
      opening: {
        primaryGoal: 'rapid_dev',
        prompt: '기물들을 고르게 전개하며 퀸의 기동 경로를 빠르게 열어라.'
      },
      middlegame: {
        strategy: 'tactical_assault',
        prompt: '퀸과 룩을 같은 열에 배치하여 치명적인 관통 공격을 가하라.'
      },
      endgame: {
        victoryPlan: 'speed_mate',
        prompt: '강력한 여왕의 기동성으로 남은 적들을 몰아세워 체크메이트하라.'
      }
    },
    signatureTactic: 'queen_battery',
    riskTolerance: 50,
    persona: {
      trait: 'confident',
      dialogues: {
        matchStart: '보드 위의 여왕 앞에 모두 고개를 숙여라.',
        onCapture: '무엄하게 여왕의 앞길을 막다니!',
        onCheck: '여왕의 칙령이다, 물러서라! 체크!',
        onVictory: '완벽한 통치 아래 승리가 선포되었다.',
        onCrisis: '단지 전략적 후퇴일 뿐이다.'
      }
    }
  },
  {
    id: 'bot-grandmaster',
    name: '침묵의 대현자',
    creator: '아레나 AI',
    avatar: '🧙‍♂️',
    title: '완벽주의 밸런스형',
    description: '모든 스탯이 균형 잡힌 정통파. 클래식한 원칙에 충실한 강력한 수읽기 AI',
    stats: { attack: 25, defense: 25, control: 30, mobility: 20 },
    pieceSettings: {
      pawn: { weight: 105, aggression: 50, role: 'breakthrough', label: '폰' },
      knight: { weight: 330, aggression: 65, role: 'center_invader', label: '나이트' },
      bishop: { weight: 335, aggression: 65, role: 'diagonal_controller', label: '비숍' },
      rook: { weight: 510, aggression: 60, role: 'open_file', label: '룩' },
      queen: { weight: 980, aggression: 70, role: 'tactician', label: '퀸' },
      king: { weight: 20000, aggression: 20, role: 'castle_bunker', label: '킹' },
    },
    phases: {
      opening: {
        primaryGoal: 'center_control',
        prompt: '체스의 정석에 따라 중앙을 차지하고 캐슬링을 마친 후 균형 있게 전개하라.'
      },
      middlegame: {
        strategy: 'piece_exchange',
        prompt: '유리한 국면에서 적절한 교환을 통해 상대의 공격 가능성을 차단하라.'
      },
      endgame: {
        victoryPlan: 'pawn_promotion',
        prompt: '킹을 중앙으로 옮겨 폰을 지원하고 오차 없는 엔드게임 승리를 거둬라.'
      }
    },
    signatureTactic: 'iron_fortress',
    riskTolerance: 20,
    persona: {
      trait: 'philosopher',
      dialogues: {
        matchStart: '체스는 보드 위에서 나누는 깊은 대화입니다.',
        onCapture: '균형의 추가 한쪽으로 기울어지는군요.',
        onCheck: '질서 속에서 길을 찾아보십시오. 체크.',
        onVictory: '정밀한 수읽기가 맺은 자연스러운 결실입니다.',
        onCrisis: '아직 수읽기의 수는 끝나지 않았습니다.'
      }
    }
  },
  {
    id: 'bot-speed-fox',
    name: '질주의 번개여우',
    creator: '아레나 AI',
    avatar: '⚡',
    title: '초스피드 기동형',
    description: '기동성과 공간 확장에 올인! 예측 불허의 루트로 킹의 뒷공간을 파고드는 AI',
    stats: { attack: 35, defense: 15, control: 20, mobility: 30 },
    pieceSettings: {
      pawn: { weight: 100, aggression: 65, role: 'breakthrough', label: '폰' },
      knight: { weight: 350, aggression: 85, role: 'center_invader', label: '나이트' },
      bishop: { weight: 340, aggression: 80, role: 'sniper', label: '비숍' },
      rook: { weight: 510, aggression: 70, role: 'open_file', label: '룩' },
      queen: { weight: 960, aggression: 80, role: 'striker', label: '퀸' },
      king: { weight: 20000, aggression: 30, role: 'commander', label: '킹' },
    },
    phases: {
      opening: {
        primaryGoal: 'rapid_dev',
        prompt: '1초도 쉬지 않고 가장 빠른 기물들을 전진시켜 템포를 빼앗아라.'
      },
      middlegame: {
        strategy: 'tactical_assault',
        prompt: '상대가 진형을 갖추기 전에 빈틈을 찾아 속공으로 파고들어라.'
      },
      endgame: {
        victoryPlan: 'speed_mate',
        prompt: '속도로 압도하여 최단 거리 체크메이트를 노려라.'
      }
    },
    signatureTactic: 'gambit_rush',
    riskTolerance: 65,
    persona: {
      trait: 'confident',
      dialogues: {
        matchStart: '눈 깜짝할 사이에 승부가 결정될 거야!',
        onCapture: '번개처럼 낚아챘지!',
        onCheck: '피할 틈이나 있을까? 체크!',
        onVictory: '스피드의 승리! 내 움직임을 못 따라왔군.',
        onCrisis: '빨리 방향을 틀면 그만이야!'
      }
    }
  }
];
