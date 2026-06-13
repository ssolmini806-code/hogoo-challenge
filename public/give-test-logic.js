const questions = [
    { q: "[소진 신호] 누군가를 돕고 난 뒤 내 상태는?", a: ["가볍고 뿌듯하다", "조금 피곤하지만 괜찮다", "한동안 멍하고 지친다", "사람을 피하고 싶을 만큼 방전된다"] },
    { q: "[소진 신호] 부탁을 받기 전부터 몸이 먼저 반응할 때가 있나요?", a: ["거의 없다", "가끔 부담을 느낀다", "자주 가슴이 답답하다", "연락 알림만 봐도 긴장된다"] },
    { q: "[소진 신호] 내 일정이 있는데도 남의 급한 일을 맡게 되면?", a: ["내 일정부터 확인한다", "조율해서 일부만 돕는다", "내 일을 미루고 돕는다", "내가 망가져도 끝까지 떠안는다"] },
    { q: "[소진 신호] 최근 한 달 동안 '나만 왜 이렇게 지치지?'라는 생각이 든 빈도는?", a: ["거의 없다", "가끔 있다", "자주 있다", "거의 매주 반복된다"] },

    { q: "[거절 곤란] 부탁을 거절하기 직전 가장 먼저 떠오르는 건?", a: ["내가 가능한 범위", "상대에게 덜 미안한 표현", "상대가 실망할 표정", "관계가 깨질지도 모른다는 불안"] },
    { q: "[거절 곤란] 눈앞에서 갑작스러운 부탁을 받으면?", a: ["생각해보고 답한다고 말한다", "가능한 범위를 먼저 묻는다", "망설이다가 수락한다", "싫어도 거의 바로 수락한다"] },
    { q: "[거절 곤란] 거절한 뒤 내 마음은?", a: ["금방 괜찮아진다", "조금 찜찜하지만 넘긴다", "하루 종일 신경 쓰인다", "결국 다시 연락해서 해주게 된다"] },
    { q: "[거절 곤란] 윗사람이나 가족의 부탁 앞에서는?", a: ["관계와 별개로 범위를 말한다", "조심스럽게 조율한다", "대부분 맞춰준다", "거절은 거의 불가능하다고 느낀다"] },

    { q: "[상호성 결핍] 같은 사람이 반복해서 부탁하면 나는?", a: ["반복 여부를 말하고 기준을 세운다", "이번 범위까지만 돕는다", "불편하지만 또 돕는다", "관계상 어쩔 수 없다고 계속 떠안는다"] },
    { q: "[상호성 결핍] 도움을 줬는데 감사나 피드백이 없으면?", a: ["다음 조건을 조정한다", "아쉽지만 넘긴다", "서운함이 오래 간다", "내 가치가 무시된 것처럼 느낀다"] },
    { q: "[상호성 결핍] 내가 힘들 때 상대에게 도움을 요청하는 편인가요?", a: ["필요하면 요청한다", "가까운 사람에게는 한다", "대부분 혼자 해결한다", "도움을 요청하면 민폐라고 느낀다"] },
    { q: "[상호성 결핍] 도움을 줄 때 보답이나 역할 분담을 말하는 것은?", a: ["건강한 조율이라고 본다", "필요하면 말할 수 있다", "말하면 계산적으로 보일까 걱정된다", "아예 말하지 못한다"] },

    { q: "[회복력] 도운 뒤 회복 시간을 따로 확보하나요?", a: ["대체로 확보한다", "필요할 때는 쉰다", "알면서도 자주 못 쉰다", "쉬는 걸 미안하게 느낀다"] },
    { q: "[회복력] 도움 뒤 억울함이나 피로를 점검하는 습관은?", a: ["기록하거나 바로 알아차린다", "가끔 돌아본다", "쌓인 뒤에야 안다", "터질 때까지 모른 척한다"] },
    { q: "[회복력] 내 에너지가 5/10 이하일 때 부탁이 오면?", a: ["다음으로 미룬다", "짧게 가능한 범위만 돕는다", "무리해서라도 한다", "내 상태와 상관없이 해줘야 한다고 느낀다"] },
    { q: "[회복력] 나를 돌보는 시간을 지키는 감각은?", a: ["중요한 약속처럼 지킨다", "가끔 흔들리지만 회복한다", "남의 일에 자주 밀린다", "내 시간은 항상 마지막이다"] }
];

const results = {
    angel: {
        name: "다 주고 빈 손 🐶",
        tagline: "\"어… 그래 해줄게\"",
        summary: "거절이라는 단어가 사전에 없어요. 착한 게 아니라 불편함을 피하는 거예요. 결과적으로 내가 비어갑니다.",
        strength: "공감 능력이 뛰어나고 주변 사람에게 깊은 안정감을 줍니다.",
        risk: "거절하지 못해 내 일정, 감정, 돈이 뒤로 밀릴 수 있습니다.",
        advice: "도와주고 싶은 마음은 있지만, 지금은 제가 감당할 수 있는 범위를 넘어서 어려워요.",
        spectrum: { pos: 18, label: "Selfless 쪽에 가까워요. 마음은 크지만 내 회복 시간이 자주 뒤로 밀릴 수 있습니다." },
        character: "/images/types/give-id/type-angel.webp",
        next: { title: "다음: 왜 거절 못할까?", copy: "“미안해서” 또 당하는 사람용.", url: "refusal-test.html" },
        color: "var(--amber-soft)"
    },
    diplomat: {
        name: "분위기 지킴이",
        tagline: "\"괜히 나만 불편하게 하지 말자\"",
        summary: "갈등을 피하려고 내 기준을 살짝 내려놓는 습관이 생겼어요. 분위기는 좋아지는데 내 마음은 찜찜합니다.",
        strength: "상황 파악이 빠르고 갈등을 완충하는 힘이 있습니다.",
        risk: "겉으로 웃다가 속으로 피로와 억울함이 쌓일 수 있습니다.",
        advice: "지금 바로 답하기는 어려워요. 일정 확인하고 가능한 범위만 다시 말해줄게요.",
        spectrum: { pos: 34, label: "Selfless와 Otherish 사이에서 눈치를 많이 보는 구간입니다. 즉답을 늦추면 균형이 생깁니다." },
        character: "/images/types/give-id/type-diplomat.webp",
        next: { title: "다음: 그 관계 괜찮아?", copy: "계속 맞춰주면 언젠가 터져요.", url: "relationship-risk.html" },
        color: "var(--amber-soft)"
    },
    architect: {
        name: "계산 빠른 살림꾼",
        tagline: "\"이건 되고 저건 안 돼\"",
        summary: "시간과 에너지를 합리적으로 씁니다. 가끔 차갑다는 말을 듣지만, 사실 자기 보호가 잘 되는 편이에요.",
        strength: "리소스 관리와 판단력이 뛰어나 쉽게 휘둘리지 않습니다.",
        risk: "상대에게 거리감이 크게 느껴져 중요한 연결을 잃을 수 있습니다.",
        advice: "이번 요청은 제가 맡기는 어렵지만, 참고할 방법은 같이 생각해볼 수 있어요.",
        spectrum: { pos: 72, label: "Otherish 쪽에 가깝습니다. 기준은 좋고, 여기에 따뜻한 설명을 조금 더하면 관계 비용이 줄어듭니다." },
        character: "/images/types/give-id/type-awakening.webp",
        next: { title: "다음: 선일까, 벽일까?", copy: "좋은 사람까지 밀어내는지 확인.", url: "relationship-risk.html" },
        color: "var(--surface-2)"
    },
    guardian: {
        name: "선 잘 긋는 문지기",
        tagline: "\"여기까지만요\"",
        summary: "기준이 명확합니다. 다만 유연성이 조금 더 생기면 관계가 더 따뜻해질 수 있어요.",
        strength: "자신의 한계와 원칙을 명확히 알고 있습니다.",
        risk: "새로운 사람에게 마음을 여는 속도가 너무 늦어질 수 있습니다.",
        advice: "여기까지는 가능하지만, 그 이상은 제 일정상 어렵습니다.",
        spectrum: { pos: 82, label: "Otherish 기버에 가깝습니다. 선을 지키는 힘이 강하고, 유연한 제안이 더해지면 더 단단해집니다." },
        character: "/images/types/give-id/type-gatekeeper.webp",
        next: { title: "다음: 나 진짜 안 당할까?", copy: "특정 사람 앞에서만 무너질 수 있어요.", url: "hogoo-check.html" },
        color: "var(--green-soft)"
    },
    burnout: {
        name: "방전된 햄스터 🔋",
        tagline: "\"이제 좀 쉬고 싶다…\"",
        summary: "오래 달렸어요. 지금은 멈춤이 필요한 시점입니다. 쉬는 것도 능력이에요.",
        strength: "헌신적이고 책임감이 강해 쉽게 관계를 포기하지 않습니다.",
        risk: "작은 부탁에도 예민해지고 사람 자체를 피하게 될 수 있습니다.",
        advice: "미안하지만 오늘은 추가로 맡기 어렵습니다. 먼저 회복 시간이 필요해요.",
        spectrum: { pos: 10, label: "방전된 Selfless 구간입니다. 더 잘 돕기보다 먼저 멈추고 회복하는 게 필요합니다." },
        character: "/images/types/give-id/type-hamster.webp",
        next: { title: "다음: 이제 그만해도 돼요", copy: "착함 말고 멈춤이 필요해요.", url: "refusal-test.html" },
        color: "var(--amber-soft)"
    },
    blocker: {
        name: "철벽 고슴도치 🦔",
        tagline: "\"일단 가시부터\"",
        summary: "이용당하지 않으려고 가시를 세웠어요. 안전하지만 좋은 연결도 막힐 수 있어요.",
        strength: "불필요한 희생과 감정 소모를 잘 피합니다.",
        risk: "결정적인 순간 도움을 청할 사람이 부족해질 수 있습니다.",
        advice: "그 방식은 어렵지만, 부담 없는 작은 도움이라면 받아볼게요.",
        spectrum: { pos: 88, label: "방어적 Otherish 구간입니다. 손해는 잘 막지만, 안전한 호의를 받아들이는 연습이 도움이 됩니다." },
        character: "/images/types/give-id/type-hedgehog.webp",
        next: { title: "다음: 방어하다 외로워짐", copy: "상처는 피했는데 사람도 사라질 수 있어요.", url: "relationship-risk.html" },
        color: "var(--mint-soft)"
    },
    mixed: {
        name: "줄타기 균형러",
        tagline: "\"상황 봐서\"",
        summary: "상황에 따라 유연하게 움직입니다. 일관된 기준이 생기면 더 단단해질 수 있어요.",
        strength: "상황 적응력이 좋고 관계를 한쪽으로 몰아가지 않습니다.",
        risk: "기준이 불명확해 반복적으로 손해 보는 관계가 생길 수 있습니다.",
        advice: "가능한 범위는 여기까지예요. 그 밖의 부분은 다시 정해봐야 합니다.",
        spectrum: { pos: 56, label: "균형을 찾아가는 중간 구간입니다. 반복해서 지킬 최소 기준 하나가 핵심입니다." },
        character: "/images/types/give-id/type-balancer.webp",
        next: { title: "다음: 내가 무너지는 순간", copy: "기준이 애매하면 또 반복돼요.", url: "hogoo-check.html" },
        color: "var(--green-soft)"
    }
};

const shareCardMeta = {
    angel: {
        code: "GIVE-ANGEL-01",
        tags: ["#먼저챙김", "#거절연습중", "#따뜻한사람"],
        stats: { care: 96, boundary: 34, recovery: 58 }
    },
    diplomat: {
        code: "GIVE-DIPLO-02",
        tags: ["#분위기감지", "#갈등완충", "#내기준찾기"],
        stats: { care: 84, boundary: 48, recovery: 62 }
    },
    architect: {
        code: "GIVE-ARCH-03",
        tags: ["#관계설계", "#효율중시", "#온기추가"],
        stats: { care: 61, boundary: 86, recovery: 74 }
    },
    guardian: {
        code: "GIVE-GUARD-04",
        tags: ["#선명한선", "#안전우선", "#유연함연습"],
        stats: { care: 66, boundary: 94, recovery: 78 }
    },
    burnout: {
        code: "GIVE-BURN-05",
        tags: ["#지친기버", "#회복필요", "#멈춤연습"],
        stats: { care: 91, boundary: 42, recovery: 29 }
    },
    blocker: {
        code: "GIVE-BLOCK-06",
        tags: ["#철벽방어", "#손해차단", "#연결연습"],
        stats: { care: 45, boundary: 96, recovery: 69 }
    },
    mixed: {
        code: "GIVE-MIX-07",
        tags: ["#밸런서", "#상황판단", "#기준세우기"],
        stats: { care: 73, boundary: 70, recovery: 68 }
    }
};

const axisDefinitions = {
    burnout: {
        title: "소진 신호",
        short: "도움 뒤 방전",
        low: "회복 가능한 수준",
        mid: "피로 누적 구간",
        high: "멈춤이 필요한 구간",
        action: "오늘은 추가 부탁을 받기 전, 먼저 내 에너지 잔량을 확인하세요."
    },
    refusal: {
        title: "거절 곤란",
        short: "미안함과 체면",
        low: "기준 표현 가능",
        mid: "즉답 주의 구간",
        high: "죄책감 자동수락 구간",
        action: "바로 답하지 말고 '확인하고 다시 말할게요'로 시간을 버세요."
    },
    reciprocity: {
        title: "상호성 누수",
        short: "감사·분담 결핍",
        low: "교환 균형 양호",
        mid: "역할 조율 필요",
        high: "일방적 제공 위험",
        action: "도움을 줄 때 다음 역할 분담이나 피드백을 함께 요청하세요."
    },
    recovery: {
        title: "회복력 저하",
        short: "쉬는 힘 부족",
        low: "회복 루틴 유지",
        mid: "회복 예약 필요",
        high: "회복 시간 고갈",
        action: "도운 뒤 30분이라도 연락을 끄고 몸을 되돌리는 시간을 확보하세요."
    }
};

const typeAxisProfiles = {
    angel: { burnout: 12, refusal: 14, reciprocity: 10, recovery: 11 },
    diplomat: { burnout: 10, refusal: 14, reciprocity: 9, recovery: 10 },
    architect: { burnout: 6, refusal: 6, reciprocity: 7, recovery: 8 },
    guardian: { burnout: 6, refusal: 5, reciprocity: 6, recovery: 6 },
    burnout: { burnout: 15, refusal: 11, reciprocity: 12, recovery: 15 },
    blocker: { burnout: 7, refusal: 5, reciprocity: 13, recovery: 8 },
    mixed: { burnout: 10, refusal: 10, reciprocity: 12, recovery: 10 }
};

let current = 0;
let scores = { burnout: 0, refusal: 0, reciprocity: 0, recovery: 0 };
let finalResult = null;
let finalKey = null;

const paidDetails = {
    angel: {
        headline: "당신에게 필요한 건 더 베푸는 법이 아니라, 손해를 멈추는 기준입니다.",
        copy: "아낌없이 주는 패턴이 어떤 사람 앞에서 무너지는지, 부탁을 잠시 멈추는 첫 문장을 심화 리포트에서 확인하세요.",
        points: ["반복 부탁을 허용하게 되는 심리 트리거", "상대 체면을 해치지 않는 완곡 경계 문장", "도움과 희생을 구분하는 개인 기준표"]
    },
    diplomat: {
        headline: "분위기를 지키느라 내 기준이 사라지는 순간을 잡아야 합니다.",
        copy: "눈치와 배려가 장점으로 남도록, 관계별로 어디까지 맞춰야 하는지 선의 심리학 프레임으로 정리해드립니다.",
        points: ["갈등 회피가 손해로 바뀌는 장면", "바로 답하지 않고 시간을 버는 문장", "가족, 친구, 직장별 거리 조절 가이드"]
    },
    architect: {
        headline: "효율적인 당신에게 필요한 건 차가운 벽이 아닌 정교한 관계 설계입니다.",
        copy: "불필요한 감정 소모는 줄이고, 놓치면 아까운 관계는 남기는 판단 기준을 제공합니다.",
        points: ["손절과 조율을 가르는 체크리스트", "차갑게 보이지 않는 경계 표현", "관계 유지 비용을 낮추는 대화 순서"]
    },
    guardian: {
        headline: "선을 잘 지키는 사람도 특정 관계 앞에서는 기준이 흔들릴 수 있습니다.",
        copy: "이미 단단한 경계를 더 유연하고 설득력 있게 쓰는 방법을 심화 리포트에서 확인하세요.",
        points: ["내 경계가 벽처럼 보이는 지점", "호의를 받아도 휘둘리지 않는 방법", "믿을 만한 사람을 구분하는 기준"]
    },
    burnout: {
        headline: "지금은 더 잘 돕는 법보다, 회복을 먼저 확보하는 계획이 필요합니다.",
        copy: "심화 리포트에서는 멈춰야 할 부탁, 줄여야 할 관계, 회복 시간을 지키는 문장을 정리합니다.",
        points: ["번아웃을 키우는 반복 관계 신호", "추가 부탁을 보류하는 문장", "회복 시간을 지키는 7일 스타터 플랜"]
    },
    blocker: {
        headline: "상처를 피하는 감각은 강하지만, 좋은 연결까지 막고 있을 수 있습니다.",
        copy: "심화 리포트에서는 위험한 부탁과 받아도 되는 호의를 구분해 방어 비용을 낮추는 기준을 제공합니다.",
        points: ["방어가 과해지는 관계 패턴", "부담 없이 호의를 받아들이는 문장", "안전한 연결을 남기는 판단표"]
    },
    mixed: {
        headline: "상황마다 달라지는 당신에게 가장 필요한 건 흔들리지 않는 최소 기준입니다.",
        copy: "애매한 부탁 앞에서 매번 고민하지 않도록, 관계 원칙과 대응 문장을 구체화합니다.",
        points: ["기준이 흐려지는 대표 상황", "부탁을 판단하는 3단계 질문", "내 원칙을 부드럽게 알리는 문장"]
    }
};

const lockedInterpretations = {
    angel: [
        "당신의 친절은 관계를 따뜻하게 만들지만, 상대의 급한 마음을 내 책임으로 받아들이는 순간 피로가 시작됩니다.",
        "특히 반복 부탁 앞에서 '이번만'이라는 말이 자주 떠오른다면, 선의보다 습관이 먼저 움직이고 있을 가능성이 큽니다."
    ],
    diplomat: [
        "당신은 분위기의 온도를 빠르게 읽는 사람입니다. 문제는 그 감각이 너무 정확해서, 내 불편함보다 상대의 표정을 먼저 처리한다는 점입니다.",
        "갈등을 줄이는 능력은 강점이지만, 기준을 말하지 않는 배려는 시간이 지나면 억울함으로 쌓일 수 있습니다."
    ],
    architect: [
        "당신은 관계에서도 에너지 대비 효율을 계산할 줄 압니다. 그래서 쉽게 휘둘리지 않지만, 때로는 필요한 감정 표현까지 생략할 수 있습니다.",
        "중요한 건 모든 관계를 줄이는 것이 아니라, 남겨야 할 관계에는 충분한 온기를 투자하는 것입니다."
    ],
    guardian: [
        "당신은 선을 넘는 요청을 비교적 빠르게 감지합니다. 다만 단단함이 오래 유지되면, 안전한 사람에게도 같은 방어가 켜질 수 있습니다.",
        "앞으로의 과제는 더 강한 거절이 아니라, 믿을 만한 사람에게만 열리는 유연한 기준을 만드는 것입니다."
    ],
    burnout: [
        "지금의 피로는 의지가 약해서가 아니라, 너무 오래 마음의 초과 근무를 해왔다는 신호에 가깝습니다.",
        "작은 부탁에도 예민해진다면 사람을 싫어하게 된 것이 아니라, 회복할 시간을 충분히 받지 못한 상태일 수 있습니다."
    ],
    blocker: [
        "당신은 위험한 부탁을 빨리 알아차리는 편입니다. 그래서 손해는 줄지만, 도움을 받아도 되는 장면까지 경계할 수 있습니다.",
        "모든 요청을 차단하기보다, 내가 감당 가능한 범위와 믿을 수 있는 사람의 조건을 나눠보는 것이 필요합니다."
    ],
    mixed: [
        "당신은 한쪽으로 치우치지 않고 상황을 보는 힘이 있습니다. 다만 매번 새로 판단하다 보면 기준이 늦게 도착할 수 있습니다.",
        "관계에서 덜 지치려면 착함과 방어 사이를 오가는 대신, 반복해서 지킬 최소 원칙을 먼저 정해야 합니다."
    ]
};

function createSvgNode(tag, attrs) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
}

function characterSvg(fill) {
    const svg = createSvgNode("svg", {
        class: "character",
        viewBox: "0 0 120 128",
        fill: "none",
        "aria-hidden": "true"
    });
    [
        createSvgNode("circle", { cx: "60", cy: "64", r: "44", fill, stroke: "var(--ink)", "stroke-width": "3" }),
        createSvgNode("circle", { cx: "44", cy: "58", r: "5", fill: "var(--ink)" }),
        createSvgNode("circle", { cx: "76", cy: "58", r: "5", fill: "var(--ink)" }),
        createSvgNode("circle", { cx: "46", cy: "56", r: "1.6", fill: "var(--surface)" }),
        createSvgNode("circle", { cx: "78", cy: "56", r: "1.6", fill: "var(--surface)" }),
        createSvgNode("path", { d: "M46 78 Q60 90 74 78", stroke: "var(--ink)", "stroke-width": "4", "stroke-linecap": "round", fill: "none" }),
        createSvgNode("circle", { cx: "34", cy: "73", r: "8", fill: "var(--surface)", opacity: ".35" }),
        createSvgNode("circle", { cx: "86", cy: "73", r: "8", fill: "var(--surface)", opacity: ".35" }),
        createSvgNode("path", { d: "M30 31 C34 12 51 20 60 34 C69 20 86 12 90 31", stroke: "var(--ink)", "stroke-width": "3", "stroke-linecap": "round", fill: "none" }),
        createSvgNode("rect", { x: "45", y: "103", width: "30", height: "18", rx: "8", fill, stroke: "var(--ink)", "stroke-width": "3" })
    ].forEach((node) => svg.appendChild(node));
    return svg;
}

function characterImage(result) {
    if (!result.character) return characterSvg(result.color);
    const img = document.createElement("img");
    img.className = "character type-char";
    img.src = result.character;
    img.alt = `${result.name} 캐릭터`;
    img.loading = "lazy";
    img.decoding = "async";
    return img;
}

function renderShareIdCard(key, result) {
    const meta = shareCardMeta[key] || shareCardMeta.mixed;
    const card = document.getElementById("shareCard");
    card.style.setProperty("--card-color", result.color);
    document.getElementById("shareCharacter").replaceChildren(characterImage(result));
    document.getElementById("shareType").textContent = result.name;
    document.getElementById("shareTagline").textContent = result.tagline;
    document.getElementById("shareCode").textContent = meta.code;

    const tags = document.getElementById("shareTags");
    tags.replaceChildren();
    meta.tags.forEach((tag) => {
        const item = document.createElement("span");
        item.className = "give-id-tag";
        item.textContent = tag;
        tags.appendChild(item);
    });

    setShareCardStat("shareCare", meta.stats.care);
    setShareCardStat("shareBoundary", meta.stats.boundary);
    setShareCardStat("shareRecovery", meta.stats.recovery);
}

function renderGiverSpectrum(result) {
    const spectrum = result.spectrum || { pos: 50, label: "선의가 손해로 바뀌는 지점과 오래 지속되는 균형점을 함께 확인합니다." };
    const dot = document.getElementById("giverSpectrumDot");
    const copy = document.getElementById("giverSpectrumCopy");
    if (dot) dot.style.setProperty("--spectrum-pos", Math.max(0, Math.min(100, spectrum.pos)) + "%");
    if (copy) copy.textContent = spectrum.label;
}

function setShareCardStat(prefix, value) {
    document.getElementById(`${prefix}Stat`).style.width = `${value}%`;
    document.getElementById(`${prefix}Value`).textContent = value;
}

function startTest() {
    current = 0;
    scores = { burnout: 0, refusal: 0, reciprocity: 0, recovery: 0 };
    finalResult = null;
    finalKey = null;
    document.getElementById("landing-page").classList.add("hidden");
    document.getElementById("result-page").classList.add("hidden");
    document.getElementById("test-page").classList.remove("hidden");
    window.scrollTo(0, 0);
    renderQuestion();
}

function renderQuestion() {
    const q = questions[current];
    const pct = Math.round((current / questions.length) * 100);
    document.getElementById("qCount").textContent = `${current + 1} / ${questions.length}`;
    document.getElementById("qPercent").textContent = `${pct}%`;
    document.getElementById("progressFill").style.width = `${pct}%`;
    document.getElementById("qLabel").textContent = `Q${current + 1}`;
    document.getElementById("qText").textContent = q.q;
    document.getElementById("rewardText").textContent = getRewardText(current);

    const list = document.getElementById("answerList");
    list.replaceChildren();
    q.a.forEach((answer, index) => {
        const btn = document.createElement("button");
        btn.className = "answer-btn";
        btn.textContent = answer;
        btn.onclick = () => selectAnswer(index + 1);
        list.appendChild(btn);
    });

    const card = document.getElementById("questionCard");
    card.classList.remove("question-card");
    void card.offsetWidth;
    card.classList.add("question-card");
}

function getRewardText(idx) {
    if (idx >= 12) return "마지막 축: 도운 뒤 내가 회복되는 속도를 봅니다.";
    if (idx >= 8) return "세 번째 축: 도움의 상호성이 새고 있는지 봅니다.";
    if (idx >= 4) return "두 번째 축: 거절 직전의 불안과 죄책감을 봅니다.";
    return "첫 번째 축: 선의가 소진으로 바뀌는 신호를 봅니다.";
}

function selectAnswer(score) {
    if (current === 0) trackEvent('give_test_start');
    if (current === 4) trackEvent('give_test_progress', { checkpoint: 5 });
    if (current === 9) trackEvent('give_test_progress', { checkpoint: 10 });

    if (4 > current) scores.burnout += score;
    else if (8 > current) scores.refusal += score;
    else if (12 > current) scores.reciprocity += score;
    else scores.recovery += score;

    current += 1;
    if (questions.length > current) {
        renderQuestion();
    } else {
        document.getElementById("progressFill").style.width = "100%";
        showResult();
    }
}

function getFinalKey() {
    const { burnout, refusal, reciprocity, recovery } = scores;
    const totalRisk = burnout + refusal + reciprocity + recovery;
    const axis = [
        ["burnout", burnout],
        ["refusal", refusal],
        ["reciprocity", reciprocity],
        ["recovery", recovery]
    ].sort((a, b) => b[1] - a[1])[0][0];

    if (totalRisk <= 29) return "guardian";
    if (refusal <= 7 && reciprocity <= 8 && recovery <= 8) return "architect";
    if (refusal <= 7 && burnout <= 8 && reciprocity >= 11) return "blocker";
    if (burnout + recovery >= 25) return "burnout";
    if (burnout >= 12 && refusal >= 11) return "angel";
    if (refusal >= 12) return "diplomat";
    if (axis === "reciprocity") return "mixed";
    if (axis === "recovery") return "burnout";
    return "angel";
}

function showResult() {
    const key = getFinalKey();
    localStorage.setItem('give_test_result', key);
    localStorage.setItem('give_test_scores', JSON.stringify(scores));
    trackEvent('give_test_completed', { give_type: key });
    location.href = 'result-sequence.html?test=give&type=' + encodeURIComponent(key);
}

function showResultFromKey(key) {
    console.log("[give-test] saved result found, rendering result screen:", key);
    renderResult(key);
}

function resetFreeTestResult() {
    localStorage.removeItem('give_test_result');
    localStorage.removeItem('give_test_scores');
    const url = new URL(location.href);
    url.searchParams.delete("type");
    url.searchParams.delete("reviewed");
    history.replaceState(null, "", url.toString());

    current = 0;
    scores = { burnout: 0, refusal: 0, reciprocity: 0, recovery: 0 };
    finalResult = null;
    finalKey = null;
    document.getElementById("completion").classList.remove("show");
    document.getElementById("test-page").classList.add("hidden");
    document.getElementById("result-page").classList.add("hidden");
    document.getElementById("landing-page").classList.remove("hidden");
    window.scrollTo(0, 0);
}

function requestRetryTest() {
    window.dispatchEvent(new CustomEvent('free-test-retry-requested', {
        detail: { rootId: 'give-test-reward-root' }
    }));
}

function getScoreSnapshot(key) {
    const fallback = typeAxisProfiles[key] || typeAxisProfiles.mixed;
    try {
        const savedKey = localStorage.getItem('give_test_result');
        const raw = JSON.parse(localStorage.getItem('give_test_scores') || "{}");
        const valid = Object.keys(axisDefinitions).every((axis) => Number.isFinite(Number(raw[axis])));
        if (savedKey === key && valid) {
            return {
                burnout: Number(raw.burnout),
                refusal: Number(raw.refusal),
                reciprocity: Number(raw.reciprocity),
                recovery: Number(raw.recovery)
            };
        }
    } catch {}
    return fallback;
}

function axisLevel(score) {
    if (score >= 13) return "high";
    if (score >= 9) return "mid";
    return "low";
}

function axisLabel(axis, score) {
    const def = axisDefinitions[axis];
    const level = axisLevel(score);
    return def[level];
}

function renderAxisSnapshot(key) {
    const grid = document.getElementById("axisGrid");
    if (!grid) return;
    const snapshot = getScoreSnapshot(key);
    const entries = Object.entries(axisDefinitions).map(([axis, def]) => ({
        axis,
        def,
        score: snapshot[axis] || 4
    }));
    const strongest = entries.slice().sort((a, b) => b.score - a.score)[0];
    const lead = document.getElementById("axisSnapshotLead");
    if (lead) {
        lead.textContent = `이번 결과에서 가장 먼저 볼 축은 ${strongest.def.title}입니다. 무료 결과는 신호를 보여주고, 심화 리포트는 이 신호를 실제 문장과 루틴으로 바꿉니다.`;
    }

    grid.replaceChildren();
    entries.forEach(({ axis, def, score }) => {
        const percent = Math.round(((score - 4) / 12) * 100);
        const clamped = Math.max(0, Math.min(100, percent));
        const card = document.createElement("article");
        card.className = "axis-card axis-" + axisLevel(score);
        const top = document.createElement("div");
        top.className = "axis-card-top";
        const title = document.createElement("strong");
        title.textContent = def.title;
        const scoreText = document.createElement("span");
        scoreText.textContent = `${score}/16`;
        top.append(title, scoreText);

        const bar = document.createElement("div");
        bar.className = "axis-bar";
        bar.setAttribute("aria-hidden", "true");
        const fill = document.createElement("span");
        fill.style.width = `${clamped}%`;
        bar.appendChild(fill);

        const label = document.createElement("p");
        label.className = "axis-card-label";
        label.textContent = axisLabel(axis, score);
        const action = document.createElement("p");
        action.className = "axis-card-action";
        action.textContent = def.action;
        card.append(top, bar, label, action);
        grid.appendChild(card);
    });
}

function renderPaidPreview(key, paid) {
    const snapshot = getScoreSnapshot(key);
    const strongestAxis = Object.keys(axisDefinitions).sort((a, b) => snapshot[b] - snapshot[a])[0];
    const focus = document.getElementById("paidPreviewFocus");
    const grid = document.getElementById("paidPreviewGrid");
    if (focus) {
        focus.textContent = `${axisDefinitions[strongestAxis].title} 신호를 관계별 대응 문장으로 바꿉니다.`;
    }
    if (!grid) return;
    const cards = [
        { label: "1단계", title: axisDefinitions[strongestAxis].short, copy: "가장 높은 위험 축이 실제 관계에서 어떤 장면으로 반복되는지 해석합니다." },
        { label: "2단계", title: "한국형 문장", copy: paid.points[1] || "상대 체면을 해치지 않는 완곡 경계 문장을 제공합니다." },
        { label: "3단계", title: "30일 유지", copy: "7일 스타터 이후에도 기준이 무너지지 않도록 회복 루틴을 연결합니다." }
    ];
    grid.replaceChildren();
    cards.forEach((item) => {
        const card = document.createElement("div");
        card.className = "paid-preview-card";
        const label = document.createElement("span");
        label.textContent = item.label;
        const title = document.createElement("strong");
        title.textContent = item.title;
        const copy = document.createElement("p");
        copy.textContent = item.copy;
        card.append(label, title, copy);
        grid.appendChild(card);
    });
}

function renderResult(key) {
    console.log("[give-test] renderResult executed:", key);
    finalKey = key;
    finalResult = results[key];
    const paid = paidDetails[key] || paidDetails.mixed;
    document.getElementById("landing-page").classList.add("hidden");
    document.getElementById("test-page").classList.add("hidden");
    document.getElementById("result-page").classList.remove("hidden");
    document.getElementById("completion").classList.add("show");
    document.querySelectorAll(".result-sequence-link").forEach((link) => {
        link.href = "result-sequence.html?test=give&type=" + encodeURIComponent(key);
    });
    window.scrollTo(0, 0);
    trackEvent('give_result_viewed', { give_type: key });

    document.getElementById("character").replaceChildren(characterImage(finalResult));
    document.getElementById("typeName").textContent = finalResult.name;
    document.getElementById("typeSummary").textContent = finalResult.summary;
    document.getElementById("strength").textContent = finalResult.strength;
    document.getElementById("risk").textContent = finalResult.risk;
    document.getElementById("advice").textContent = finalResult.advice;
    renderGiverSpectrum(finalResult);
    renderAxisSnapshot(key);
    renderLockedInterpretation(key, false);
    renderShareIdCard(key, finalResult);
    document.getElementById("nextTestTitle").textContent = finalResult.next.title;
    document.getElementById("nextTestCopy").textContent = finalResult.next.copy;
    document.getElementById("nextTestBtn").onclick = () => location.href = finalResult.next.url;
    document.getElementById("paidHeadline").textContent = paid.headline;
    document.getElementById("paidCopy").textContent = paid.copy;
    document.getElementById("paidPoint1").textContent = paid.points[0];
    document.getElementById("paidPoint2").textContent = paid.points[1];
    document.getElementById("paidPoint3").textContent = paid.points[2];
    renderPaidPreview(key, paid);

    const url = new URL(location.href);
    url.searchParams.set("type", key);
    history.replaceState(null, "", url.toString());

    window.dispatchEvent(new CustomEvent('free-test-result-ready', {
        detail: { rootId: 'give-test-reward-root', resultType: finalResult.name }
    }));
}

function renderLockedInterpretation(key, unlocked) {
    const box = document.getElementById("lockedInterpretation");
    const text = document.getElementById("lockedInterpretationText");
    const paragraphs = lockedInterpretations[key] || lockedInterpretations.mixed;
    text.replaceChildren();
    paragraphs.forEach((paragraph) => {
        const p = document.createElement("p");
        p.textContent = paragraph;
        text.appendChild(p);
    });
    box.classList.toggle("unlocked", Boolean(unlocked));
}

function scrollToRewardSection() {
    document.getElementById("give-test-reward-root")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

document.getElementById("lockedInterpretationOverlay").addEventListener("click", scrollToRewardSection);

let _shareTracked = false;
window.addEventListener("free-test-reward-status", (event) => {
    const detail = event.detail || {};
    if (detail.rootId && detail.rootId !== "give-test-reward-root") return;
    if (!finalKey) return;
    const isShared = Boolean(detail.isShared);
    if (isShared && !_shareTracked) {
        _shareTracked = true;
        trackEvent('give_share_confirmed', { give_type: finalKey });
        trackEvent('give_reward_unlocked', { reward_type: 'sns_share', give_type: finalKey });
    }
    renderLockedInterpretation(finalKey, isShared);
});

window.addEventListener("free-test-reset-result", (event) => {
    const detail = event.detail || {};
    if (detail.rootId && detail.rootId !== "give-test-reward-root") return;
    resetFreeTestResult();
});

let hogooCheckUnlocked = false;

function handleHogooCheckClick() {
    if (hogooCheckUnlocked) {
        location.href = 'hogoo-check.html';
    } else {
        document.getElementById('give-test-reward-root')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

window.addEventListener("free-test-reward-status", (event) => {
    const detail = event.detail || {};
    if (detail.rootId && detail.rootId !== "give-test-reward-root") return;
    hogooCheckUnlocked = Boolean(detail.isReviewed);
    const card = document.getElementById("hogooCheckCard");
    const icon = card?.querySelector(".related-icon");
    const status = document.getElementById("hogooCheckStatus");
    if (!card || !icon || !status) return;
    if (hogooCheckUnlocked) {
        card.style.opacity = "1";
        icon.style.background = "var(--mint)";
        icon.style.color = "var(--ink)";
        icon.textContent = "01";
        status.textContent = "착한 건지, 만만한 건지";
    } else {
        card.style.opacity = "0.65";
        icon.style.background = "var(--surface-2)";
        icon.style.color = "var(--green)";
        icon.textContent = "잠금";
        status.textContent = "후기를 작성하면 열려요";
    }
});

function paidUrl(source) {
    const configuredUrl = window.__PAID_SITE_URL && !String(window.__PAID_SITE_URL).includes("%VITE_")
        ? window.__PAID_SITE_URL
        : "https://givecosystem.com/";
    const url = new URL(configuredUrl);
    url.searchParams.set("utm_source", "give_id_free_result");
    url.searchParams.set("utm_medium", "cta");
    url.searchParams.set("utm_campaign", "paid_conversion");
    url.searchParams.set("utm_content", source);
    if (finalKey) url.searchParams.set("type", finalKey);
    return url.toString();
}

function openPaid(source) {
    trackEvent('paid_cta_clicked', { source: source, give_type: finalKey });
    window.open(paidUrl(source), "_blank", "noopener,noreferrer");
}

function shareText() {
    const type = finalResult ? finalResult.name : "GIVE ID";
    return `내 GIVE ID는 ${type}. 선의 심리학 자가점검으로 내 관계 패턴을 봤어요.`;
}

async function shareResult() {
    const text = shareText();
    if (navigator.share) {
        await navigator.share({ title: "GIVE ID Test", text, url: location.href });
        return;
    }
    await copyLink();
}

async function copyLink() {
    await navigator.clipboard.writeText(location.href);
    showToast("링크가 복사되었습니다");
}

function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 1800);
}

(function() {
    const params = new URLSearchParams(location.search);
    const queryKey = params.get('type');
    const savedKey = localStorage.getItem('give_test_result');
    const resultKey = queryKey && results[queryKey] ? queryKey : savedKey;

    console.log("[give-test] initial result check:", { queryKey, savedKey, resultKey });

    if (resultKey && results[resultKey]) {
        showResultFromKey(resultKey);
    } else if (savedKey && !results[savedKey]) {
        console.log("[give-test] invalid saved result ignored:", savedKey);
        localStorage.removeItem('give_test_result');
    }
})();
