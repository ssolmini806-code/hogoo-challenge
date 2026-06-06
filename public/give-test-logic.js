const questions = [
    { q: "친구가 밤 11시에 갑자기 연락한다.\n“나 지금 너무 힘든데 나와줄 수 있어?”", a: ["고민 없이 바로 나간다", "일단 통화부터 한다", "내일 보자고 한다", "지금은 어렵다고 말한다"] },
    { q: "오늘 쉬고 싶었는데 부탁 카톡이 왔다. 첫 생각은?", a: ["그래도 도와줘야지", "상황을 봐야지", "왜 나한테만 이러지?", "이번엔 안 한다"] },
    { q: "도와준 일이 잘 됐지만 감사 인사가 없다. 내 기분은?", a: ["그냥 뿌듯하다", "살짝 아쉽다", "꽤 서운하다", "다음부터 기준을 둔다"] },
    { q: "이번 달만 세 번째 부탁이 왔다. 나는?", a: ["또 해준다", "이번만 마지막으로 한다", "고민하다 해준다", "거절한다"] },
    { q: "처음 제대로 얘기한 사람이 벌써 두 번째 부탁을 한다.", a: ["좋은 사람 같아 받아준다", "일단 지켜본다", "살짝 쎄하다", "바로 거리 둔다"] },
    { q: "상대가 “너밖에 없어”라고 말한다.", a: ["감동받는다", "고마우면서 부담된다", "약간 의심된다", "부담스러워 거리 둔다"] },
    { q: "고마워 다음 날 또 부탁. 이 패턴이 반복된다.", a: ["그래도 나쁜 사람은 아니겠지", "이상하지만 말하기 애매하다", "이용당하는 느낌이다", "이미 선을 그었다"] },
    { q: "“부탁 하나만 해도 돼?”라는 말에 첫 반응은?", a: ["도와줘야지", "왜 나지?", "괜찮은 부탁인가?", "선 넘는 거 아냐?"] },
    { q: "상대가 앞에 있는데 이번 부탁은 어렵다. 내 입에서 나온 말은?", a: ["그래, 해줄게", "이번만 해주는 거야", "미안한데 어렵다", "지금은 힘들다"] },
    { q: "싫다고 했는데 또 같은 부탁을 한다.", a: ["그냥 참는다", "찜찜하지만 한다", "돌려서 어렵다고 말한다", "다시 분명히 거절한다"] },
    { q: "거절하기 직전, 머릿속에 뭐가 먼저 떠올라?", a: ["상대가 실망할 것 같은 표정", "어떻게 말하면 덜 상처줄까", "이게 내가 해줄 일인가", "이건 아니지 싶은 느낌"] },
    { q: "같은 사람에게서 반복 부탁이 왔다.", a: ["계속 들어준다", "점점 피한다", "한번 말해본다", "기준을 명확히 한다"] },
    { q: "두 시간 도와줬는데 상대는 “오케이~” 하고 끝낸다.", a: ["괜찮다", "살짝 서운하다", "다음부터 거리 둔다", "다음엔 기준을 정한다"] },
    { q: "나한테만 유독 자주 부탁하는 사람이 있다.", a: ["계속 해준다", "부담되지만 말 못 한다", "왜 나한테만 하냐고 묻는다", "가능한 범위를 정한다"] },
    { q: "이미 여러 번 해준 비슷한 부탁이 또 왔다. 먼저 꺼낸 말은?", a: ["이번엔 어려울 것 같아", "이번이 마지막이야", "네가 먼저 해보고 봐줄게", "앞으로 이건 네가 맡자"] },
    { q: "내가 처음 부탁했는데 상대가 “바빠서…”라고 한다.", a: ["괜찮다고 넘긴다", "서운하지만 이해한다", "나는 항상 도와줬다고 말한다", "그때부터 기준을 둔다"] }
];

const results = {
    angel: {
        name: "다 주고 빈 손 🐶",
        tagline: "\"어… 그래 해줄게\"",
        summary: "거절이라는 단어가 사전에 없어요. 착한 게 아니라 불편함을 피하는 거예요. 결과적으로 내가 비어갑니다.",
        strength: "공감 능력이 뛰어나고 주변 사람에게 깊은 안정감을 줍니다.",
        risk: "거절하지 못해 내 일정, 감정, 돈이 뒤로 밀릴 수 있습니다.",
        advice: "오늘은 작은 부탁 하나에 “지금은 어려워”라고 답해보세요.",
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
        advice: "부탁을 받으면 바로 답하지 말고 “확인하고 말해줄게”를 먼저 말하세요.",
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
        advice: "오늘은 효율과 상관없이 짧은 칭찬 한마디를 건네보세요.",
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
        advice: "내 선을 넘지 않는 범위에서 먼저 작은 제안을 해보세요.",
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
        advice: "오늘 하루는 모든 추가 부탁을 보류하고 나를 회복시키는 시간을 확보하세요.",
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
        advice: "믿을 수 있는 사람의 작은 호의 하나를 있는 그대로 받아보세요.",
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
        advice: "내가 절대 넘기지 않을 관계 원칙 하나를 적어보세요.",
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

let current = 0;
let scores = { G: 0, I: 0, V: 0, E: 0 };
let finalResult = null;
let finalKey = null;

const paidDetails = {
    angel: {
        headline: "당신에게 필요한 건 더 베푸는 법이 아니라, 손해를 멈추는 기준입니다.",
        copy: "아낌없이 주는 패턴이 어떤 사람 앞에서 무너지는지, 부탁을 끊는 첫 문장을 심화 분석에서 확인하세요.",
        points: ["반복 부탁을 허용하게 되는 심리 트리거", "상대 기분을 해치지 않는 거절 문장", "도움과 희생을 구분하는 개인 기준표"]
    },
    diplomat: {
        headline: "분위기를 지키느라 내 기준이 사라지는 순간을 잡아야 합니다.",
        copy: "눈치와 배려가 장점으로 남도록, 관계별로 어디까지 맞춰야 하는지 선을 정리해드립니다.",
        points: ["갈등 회피가 손해로 바뀌는 장면", "바로 답하지 않고 시간을 버는 문장", "가족, 친구, 직장별 거리 조절 가이드"]
    },
    architect: {
        headline: "효율적인 당신에게 필요한 건 차가운 벽이 아닌 정교한 관계 설계입니다.",
        copy: "불필요한 감정 소모는 줄이고, 놓치면 아까운 관계는 남기는 판단 기준을 제공합니다.",
        points: ["손절과 조율을 가르는 체크리스트", "차갑게 보이지 않는 경계 표현", "관계 유지 비용을 낮추는 대화 순서"]
    },
    guardian: {
        headline: "선을 잘 지키는 사람도 특정 관계 앞에서는 기준이 흔들릴 수 있습니다.",
        copy: "이미 단단한 경계를 더 유연하고 설득력 있게 쓰는 방법을 심화 분석에서 확인하세요.",
        points: ["내 경계가 벽처럼 보이는 지점", "호의를 받아도 휘둘리지 않는 방법", "믿을 만한 사람을 구분하는 기준"]
    },
    burnout: {
        headline: "지친 기버에게 지금 필요한 건 회복을 먼저 확보하는 계획입니다.",
        copy: "또 버티기 전에 멈춰야 할 부탁, 줄여야 할 관계, 오늘 당장 쓸 문장을 정리해드립니다.",
        points: ["번아웃을 키우는 반복 관계 신호", "추가 부탁을 보류하는 문장", "회복 시간을 지키는 7일 행동 플랜"]
    },
    blocker: {
        headline: "상처를 피하는 감각은 강하지만, 좋은 연결까지 막고 있을 수 있습니다.",
        copy: "위험한 부탁과 받아도 되는 호의를 구분해 방어 비용을 낮추는 기준을 제공합니다.",
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

function characterSvg(fill) {
    return `<svg class="character" viewBox="0 0 120 128" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="60" cy="64" r="44" fill="${fill}" stroke="var(--ink)" stroke-width="3"/>
        <circle cx="44" cy="58" r="5" fill="var(--ink)"/><circle cx="76" cy="58" r="5" fill="var(--ink)"/>
        <circle cx="46" cy="56" r="1.6" fill="var(--surface)"/><circle cx="78" cy="56" r="1.6" fill="var(--surface)"/>
        <path d="M46 78 Q60 90 74 78" stroke="var(--ink)" stroke-width="4" stroke-linecap="round" fill="none"/>
        <circle cx="34" cy="73" r="8" fill="var(--surface)" opacity=".35"/><circle cx="86" cy="73" r="8" fill="var(--surface)" opacity=".35"/>
        <path d="M30 31 C34 12 51 20 60 34 C69 20 86 12 90 31" stroke="var(--ink)" stroke-width="3" stroke-linecap="round" fill="none"/>
        <rect x="45" y="103" width="30" height="18" rx="8" fill="${fill}" stroke="var(--ink)" stroke-width="3"/>
    </svg>`;
}

function characterImage(result) {
    if (!result.character) return characterSvg(result.color);
    return `<img class="character type-char" src="${result.character}" alt="${result.name} 캐릭터" loading="lazy" decoding="async">`;
}

function renderShareIdCard(key, result) {
    const meta = shareCardMeta[key] || shareCardMeta.mixed;
    const card = document.getElementById("shareCard");
    card.style.setProperty("--card-color", result.color);
    document.getElementById("shareCharacter").innerHTML = characterImage(result);
    document.getElementById("shareType").textContent = result.name;
    document.getElementById("shareTagline").textContent = result.tagline;
    document.getElementById("shareCode").textContent = meta.code;

    const tags = document.getElementById("shareTags");
    tags.innerHTML = "";
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

function setShareCardStat(prefix, value) {
    document.getElementById(`${prefix}Stat`).style.width = `${value}%`;
    document.getElementById(`${prefix}Value`).textContent = value;
}

function startTest() {
    current = 0;
    scores = { G: 0, I: 0, V: 0, E: 0 };
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
    list.innerHTML = "";
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
    if (idx >= 12) return "거의 끝. 제일 찔리는 부분만 남았어요.";
    if (idx >= 8) return "절반 넘음. 당하는 장면이 보이기 시작해요.";
    if (idx >= 4) return "이미 패턴 하나 잡혔어요.";
    return "첫 답부터 티가 납니다.";
}

function selectAnswer(score) {
    if (current === 0) trackEvent('give_test_start');
    if (current === 4) trackEvent('give_test_progress', { checkpoint: 5 });
    if (current === 9) trackEvent('give_test_progress', { checkpoint: 10 });

    if (4 > current) scores.G += score;
    else if (8 > current) scores.I += score;
    else if (12 > current) scores.V += score;
    else scores.E += score;

    current += 1;
    if (questions.length > current) {
        renderQuestion();
    } else {
        document.getElementById("progressFill").style.width = "100%";
        showResult();
    }
}

function getFinalKey() {
    const { G, I, V, E } = scores;
    if (G >= 13 && 8 >= V) return "burnout";
    if (G >= 12 && 8 >= V && 9 >= E) return "angel";
    if (G >= 11 && I >= 12 && 9 >= V) return "diplomat";
    if (8 >= G && V >= 12 && I >= 11) return "blocker";
    if (G >= 10 && I >= 10 && V >= 11 && E >= 11) return "guardian";
    if (E >= 12 && 4 >= Math.abs(G - V)) return "architect";
    return "mixed";
}

function showResult() {
    const key = getFinalKey();
    localStorage.setItem('give_test_result', key);
    trackEvent('give_test_completed', { give_type: key });
    location.href = 'result-sequence.html?test=give&type=' + encodeURIComponent(key);
}

function showResultFromKey(key) {
    console.log("[give-test] saved result found, rendering result screen:", key);
    renderResult(key);
}

function resetFreeTestResult() {
    localStorage.removeItem('give_test_result');
    const url = new URL(location.href);
    url.searchParams.delete("type");
    url.searchParams.delete("reviewed");
    history.replaceState(null, "", url.toString());

    current = 0;
    scores = { G: 0, I: 0, V: 0, E: 0 };
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

    document.getElementById("character").innerHTML = characterImage(finalResult);
    document.getElementById("typeName").textContent = finalResult.name;
    document.getElementById("typeSummary").textContent = finalResult.summary;
    document.getElementById("strength").textContent = finalResult.strength;
    document.getElementById("risk").textContent = finalResult.risk;
    document.getElementById("advice").textContent = finalResult.advice;
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
    text.innerHTML = "";
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
    const url = new URL("https://givecosystem.com/");
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
    return `내 GIVE ID는 ${type}. 결과 좀 소름임.`;
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
