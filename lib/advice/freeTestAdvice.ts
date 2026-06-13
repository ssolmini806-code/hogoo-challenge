export type FreeTestAdvice = {
  type: string;
  strength: string;
  riskSignal: string;
  todayAdvice: string;
  snsShareReward: string;
  coreProblem: string;
  repeatPattern: string;
  realisticActions: [string, string, string];
};

const adviceByType: Record<string, FreeTestAdvice> = {
  giver_overloaded: {
    type: "giver_overloaded",
    strength: "상대가 곤란한 상황을 빨리 알아차리고, 실제로 움직여서 도와주는 편입니다.",
    riskSignal: "부탁을 거절하지 못해서가 아니라, 거절한 뒤 따라올 어색함과 설명을 감당하기 싫어 계속 떠맡게 됩니다.",
    todayAdvice: "오늘 들어온 부탁 중 하나는 바로 답하지 말고 '일정 보고 다시 말할게'로 끊어보세요.",
    snsShareReward: "당신이 반복해서 손해 보는 지점은 도움 자체가 아니라, 상대의 급한 일을 내 일정 위에 올려두는 습관입니다.",
    coreProblem: "내가 도와주면 일이 빨리 끝난다는 걸 주변 사람들이 이미 알고 있습니다. 그래서 처음엔 고마워하던 사람도 시간이 지나면 확인 없이 당신 시간을 쓰려고 합니다.",
    repeatPattern: "상대가 급하다고 말하면 내 일정부터 미룹니다. 끝나고 나면 고맙다는 말은 듣지만, 다음에도 비슷한 부탁이 더 쉽게 들어옵니다.",
    realisticActions: [
      "반복 부탁을 받으면 이유를 길게 설명하지 말고 '이번 주는 안 돼'까지만 말하세요.",
      "도와줄 때는 시간부터 정하세요. '30분만 가능해'처럼 끝나는 지점을 먼저 말해야 합니다.",
      "이미 맡은 일이 있다면 새 부탁을 받기 전에 기존 약속 하나를 상대에게 직접 확인하게 하세요.",
    ],
  },
  emotional_helper: {
    type: "emotional_helper",
    strength: "상대의 말투나 표정 변화를 빨리 읽고, 대화가 틀어지기 전에 분위기를 잡는 편입니다.",
    riskSignal: "상대가 기분 나빠할까 봐 내 불편함을 뒤로 미루면, 결국 당신만 대화 후유증을 오래 끌고 갑니다.",
    todayAdvice: "상대 감정을 정리해주기 전에 '내가 지금 이 얘기를 들어줄 여유가 있는지'부터 확인하세요.",
    snsShareReward: "당신이 지치는 이유는 감정이 많아서가 아니라, 남의 감정까지 계속 처리하는 역할을 맡기 때문입니다.",
    coreProblem: "상대가 힘들다고 말하는 순간, 대화의 중심이 자동으로 상대 쪽으로 넘어갑니다. 당신은 듣는 사람으로 남고, 내 상태를 말할 타이밍은 계속 사라집니다.",
    repeatPattern: "처음엔 잠깐 들어주려다가 어느새 상담자가 됩니다. 상대는 후련해지고, 당신은 대화를 끝낸 뒤에도 찝찝함과 피로를 혼자 처리합니다.",
    realisticActions: [
      "긴 하소연이 시작되면 '지금 10분 정도는 들을 수 있어'처럼 대화 시간을 먼저 잡으세요.",
      "상대 문제를 해결하려고 바로 조언하지 말고 '이건 네가 결정해야 할 문제야'라고 경계를 남기세요.",
      "내 얘기를 꺼냈을 때 상대가 계속 자기 얘기로 돌리면 그 대화는 더 이어가지 마세요.",
    ],
  },
  people_pleaser: {
    type: "people_pleaser",
    strength: "상대가 원하는 방향을 빨리 파악하고, 모임이나 관계가 어색해지지 않게 맞추는 능력이 있습니다.",
    riskSignal: "싫다는 말을 미루는 동안 상대는 당신이 괜찮다고 이해합니다. 나중에 불만을 말해도 갑자기 변한 사람처럼 보일 수 있습니다.",
    todayAdvice: "오늘 하나만은 '나는 그건 별로야'라고 짧게 말해보세요. 대안까지 붙일 필요는 없습니다.",
    snsShareReward: "당신이 손해 보는 이유는 마음이 약해서가 아니라, 싫은 티를 내기 전에 먼저 분위기부터 계산하기 때문입니다.",
    coreProblem: "관계가 틀어지는 상황을 피하려고 매번 작은 양보를 선택합니다. 문제는 그 작은 양보가 쌓이면 주변 사람들은 당신의 기준을 모르게 된다는 점입니다.",
    repeatPattern: "처음엔 별일 아니라고 넘깁니다. 몇 번 반복되면 상대는 같은 방식으로 요구하고, 당신은 이제 와서 말하기 애매해서 또 넘어갑니다.",
    realisticActions: [
      "싫은 제안에는 '생각해볼게' 대신 '나는 안 할래'처럼 결론이 보이는 말을 쓰세요.",
      "상대가 서운해하면 바로 달래지 말고, 서운함을 표현할 시간을 그대로 두세요.",
      "모임, 돈, 시간 문제는 단체 분위기보다 내 한계를 먼저 정하고 답하세요.",
    ],
  },
  relationship_exhausted: {
    type: "relationship_exhausted",
    strength: "관계를 쉽게 끊기보다 오래 버티고, 상대 사정을 여러 번 고려해보는 편입니다.",
    riskSignal: "이미 지쳤는데도 관계를 유지하는 쪽으로만 생각하면, 작은 연락 하나에도 과하게 예민해질 수 있습니다.",
    todayAdvice: "오늘은 답장을 빨리 하는 것보다, 답장할 수 있는 상태인지 먼저 보세요.",
    snsShareReward: "지금 필요한 건 더 노력하는 법이 아니라, 더는 감당하지 않아도 되는 관계를 구분하는 일입니다.",
    coreProblem: "관계가 힘든데도 '내가 예민한 건가'를 먼저 의심합니다. 그러는 사이 상대의 무례함이나 반복된 요구는 점점 평범한 일처럼 굳어집니다.",
    repeatPattern: "불편한 일이 생기면 바로 말하지 않고 며칠 생각합니다. 그러다 연락이 오면 또 평소처럼 받아주고, 혼자 있을 때만 관계를 끊을지 고민합니다.",
    realisticActions: [
      "읽기만 해도 피곤한 연락은 바로 답하지 말고 최소 한 시간 뒤에 답하세요.",
      "만난 뒤 기분이 계속 가라앉는 사람은 당분간 먼저 약속을 잡지 마세요.",
      "상대가 같은 말로 다시 압박하면 새 설명을 만들지 말고 이전 답을 반복하세요.",
    ],
  },
  boundary_missing: {
    type: "boundary_missing",
    strength: "상황을 둥글게 넘기고, 상대가 민망하지 않게 맞춰주는 데 익숙합니다.",
    riskSignal: "선을 말하지 않으면 상대는 선이 없는 줄 압니다. 나중에 화가 나는 쪽은 대부분 당신입니다.",
    todayAdvice: "오늘 불편한 요청을 받으면 가능한지부터 생각하지 말고, 내 기준에 맞는지부터 보세요.",
    snsShareReward: "반복적으로 손해 보는 이유는 선이 없어서가 아니라, 선을 말하는 순간 생길 반응을 피하기 때문입니다.",
    coreProblem: "마음속 기준은 있지만 밖으로 꺼내지 않습니다. 그래서 상대는 계속 한 발 더 들어오고, 당신은 매번 '이 정도까지는 괜찮겠지' 하며 물러납니다.",
    repeatPattern: "처음엔 작은 부탁이라 넘깁니다. 다음엔 더 큰 부탁이 오고, 그때 거절하려 하면 상대는 왜 갑자기 그러냐는 반응을 보입니다.",
    realisticActions: [
      "돈, 시간, 감정노동이 들어가는 부탁은 즉답하지 말고 하루 뒤에 답하세요.",
      "거절할 때 사과를 길게 붙이지 마세요. '이번엔 어렵다' 한 문장이 더 잘 먹힙니다.",
      "한 번 넘긴 선은 다음 요청에서 더 빨리 말하세요. 늦게 말할수록 설명 비용만 커집니다.",
    ],
  },
};

const typeAliases: Record<string, keyof typeof adviceByType> = {
  "giver-overloaded": "giver_overloaded",
  "giver overloaded": "giver_overloaded",
  "overloaded giver": "giver_overloaded",
  "과부하 기버": "giver_overloaded",
  "과부하형 기버": "giver_overloaded",
  "퍼주다 지친 기버": "giver_overloaded",
  "다 주고 빈 손 🐶": "giver_overloaded",
  "다 주고 빈 손": "giver_overloaded",

  "emotional-helper": "emotional_helper",
  "emotional helper": "emotional_helper",
  "감정 도우미": "emotional_helper",
  "감정 케어형": "emotional_helper",
  "감정 노동형": "emotional_helper",
  "분위기 지킴이": "people_pleaser",
  "방전된 햄스터 🔋": "relationship_exhausted",
  "방전된 햄스터": "relationship_exhausted",

  "people-pleaser": "people_pleaser",
  "people pleaser": "people_pleaser",
  "눈치형": "people_pleaser",
  "맞춰주는 사람": "people_pleaser",
  "관계 맞춤형": "people_pleaser",

  "relationship-exhausted": "relationship_exhausted",
  "relationship exhausted": "relationship_exhausted",
  "관계 소진형": "relationship_exhausted",
  "관계 번아웃": "relationship_exhausted",
  "지친 관계형": "relationship_exhausted",
  "계산 빠른 살림꾼": "boundary_missing",
  "철벽 고슴도치 🦔": "boundary_missing",
  "철벽 고슴도치": "boundary_missing",

  "boundary-missing": "boundary_missing",
  "boundary missing": "boundary_missing",
  "경계 부족형": "boundary_missing",
  "선 긋기 약한 유형": "boundary_missing",
  "경계 실종형": "boundary_missing",
  "선 잘 긋는 문지기": "boundary_missing",
  "줄타기 균형러": "giver_overloaded",
};

const defaultAdvice: FreeTestAdvice = {
  type: "unknown",
  strength: "관계에서 반복되는 불편함을 그냥 넘기지 않고 확인하려는 상태입니다.",
  riskSignal: "상대에게 맞추는 일이 반복되면, 어느 순간부터 내 기준보다 상대 반응을 먼저 보게 됩니다.",
  todayAdvice: "오늘 들어온 요청 하나는 바로 답하지 말고, 내가 감당할 수 있는 범위인지 먼저 확인하세요.",
  snsShareReward: "반복적으로 손해 보는 이유는 대부분 큰 사건보다 작은 양보가 계속 쌓이는 데 있습니다.",
  coreProblem: "불편한 장면이 생겼을 때 바로 기준을 말하지 않고 일단 넘기는 쪽을 선택합니다. 그러면 상대는 그 방식이 가능하다고 배우고, 다음 요청은 더 쉽게 들어옵니다.",
  repeatPattern: "처음엔 분위기를 망치기 싫어서 참습니다. 나중엔 이미 여러 번 받아준 일이 되어 거절하기 어려워지고, 결국 혼자 불만을 정리하게 됩니다.",
  realisticActions: [
    "부탁을 받으면 즉답하지 말고 '확인하고 말할게'로 시간을 확보하세요.",
    "거절 사유를 길게 만들지 말고 '이번엔 어렵다'처럼 짧게 끝내세요.",
    "같은 사람이 같은 방식으로 부담을 주면 새 설명을 붙이지 말고 이전 기준을 반복하세요.",
  ],
};

function normalizeType(type: string) {
  return type.trim().toLowerCase();
}

export function getAdviceByType(type: string): FreeTestAdvice {
  const normalizedType = normalizeType(type);
  const aliasedType = typeAliases[normalizedType] ?? normalizedType;
  return adviceByType[aliasedType] ?? defaultAdvice;
}
