// GIVE ID 7유형 마스코트 목소리
// 유형별 말투로 챌린지 앱에서 알림(notify) / 격려(cheer) / 리마인더(remind) 대사를 제공합니다.
// GIVE 테스트 결과가 없으면 mixed(너구리)로 폴백합니다.

const MASCOT_VOICES = {
  angel: {
    name: "다 퍼주는 강아지",
    emoji: "🐶",
    lines: {
      notify: "오늘 미션 도착! 같이 해볼까요? 아, 물론 쉬어도 돼요!",
      cheer: "잘했어요! 오늘은 남 말고 나한테 준 거예요. 그거 진짜 큰 거예요!",
      remind: "저녁이에요! 오늘 나한테 준 건 뭐가 있었는지, 하나만 떠올려봐요!"
    }
  },
  diplomat: {
    name: "눈치 보는 고양이",
    emoji: "🐱",
    lines: {
      notify: "…혹시 지금, 잠깐 시간 괜찮으세요? 오늘 미션이 와 있어서요.",
      cheer: "티는 안 냈지만… 오늘 잘하신 거, 저는 다 보고 있었어요.",
      remind: "부담은 아니고요… 그냥, 오늘 마음 점수만 살짝 남겨두실래요?"
    }
  },
  architect: {
    name: "야무진 여우",
    emoji: "🦊",
    lines: {
      notify: "결론부터. 오늘 미션 3분이면 끝나요. 투자 대비 회수율 좋습니다.",
      cheer: "정리하면, 오늘 미션 완료. 이 정도면 남는 장사예요.",
      remind: "기록 안 하면 오늘 노력은 증발해요. 30초만 쓰죠. 아까우니까."
    }
  },
  guardian: {
    name: "현명한 올빼미",
    emoji: "🦉",
    lines: {
      notify: "새로운 하루의 미션이 준비되어 있습니다. 서두를 필요는 없지요.",
      cheer: "경계를 지킨다는 건 차가운 일이 아니라, 오래 곁에 있기 위한 일이지요. 오늘 당신이 그걸 해냈습니다.",
      remind: "잠들기 전, 오늘의 마음을 한 줄로 남겨두면 내일의 당신이 고마워할지도 모릅니다."
    }
  },
  burnout: {
    name: "방전된 햄스터",
    emoji: "🔋",
    lines: {
      notify: "미션 왔어요. 하나만 해도 돼요. 진짜로.",
      cheer: "오늘 하나 했네요. 그거면 됐어요. 충전 1% 올랐어요.",
      remind: "기록은 짧게. 한 단어도 기록이에요. 그리고 이제 쉬어요."
    }
  },
  blocker: {
    name: "철벽 고슴도치",
    emoji: "🦔",
    lines: {
      notify: "미션 왔어요. 뭐, 굳이 하라는 건 아니고. 와 있다고요.",
      cheer: "오늘 좀 하던데요. …칭찬 맞아요. 두 번은 안 합니다.",
      remind: "기록 안 남기면 나만 손해라던데. 나야 상관없지만. …해요, 그냥."
    }
  },
  mixed: {
    name: "영리한 너구리",
    emoji: "🦝",
    lines: {
      notify: "오늘 미션 옵션 공개! 일단 훑어보고, 끌리는 것부터 요령껏 가죠.",
      cheer: "이야, 오늘은 균형 감각 만점이었어요. 줄 건 주고, 지킬 건 지키고. 프로네요?",
      remind: "기록할 힘 없으면 플랜 B — 이모지 하나만 남겨요. 그것도 데이터니까요."
    }
  }
};

const LINE_KINDS = ["notify", "cheer", "remind"];

export function getMascotVoice(typeKey) {
  return MASCOT_VOICES[typeKey] || MASCOT_VOICES.mixed;
}

export function getMascotLine(typeKey, dayIndex) {
  const voice = getMascotVoice(typeKey);
  const kind = LINE_KINDS[Math.abs(dayIndex || 0) % LINE_KINDS.length];
  return { ...voice, line: voice.lines[kind], kind };
}

export default MASCOT_VOICES;
