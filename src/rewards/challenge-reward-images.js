const BACKGROUND_URL = '/images/rewards/seven-day-keepsake-bg-v1.webp';
const INK = '#2f2419';
const VERMILION = '#a83b27';
const PAPER = '#f7eedb';

function createCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Reward artwork could not be loaded: ${src}`));
    image.src = src;
  });
}

function roundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function wrapText(context, text, x, y, maxWidth, lineHeight, maxLines = 3) {
  const characters = [...String(text || '')];
  const lines = [];
  let line = '';
  for (const character of characters) {
    const candidate = line + character;
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = character;
      if (lines.length === maxLines - 1) break;
    } else {
      line = candidate;
    }
  }
  const used = lines.join('').length;
  if (line && lines.length < maxLines) {
    const truncated = used + line.length < characters.length;
    lines.push(truncated ? `${line.slice(0, -1)}…` : line);
  }
  lines.forEach((value, index) => context.fillText(value, x, y + index * lineHeight));
  return lines.length;
}

async function prepare(width, height) {
  if (document.fonts) {
    await Promise.all([
      document.fonts.ready,
      document.fonts.load('700 92px "Give Hahmlet"'),
      document.fonts.load('400 92px "Give Brush"'),
    ]);
  }
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is not supported');
  const image = await loadImage(BACKGROUND_URL);
  context.drawImage(image, 0, 0, width, height);
  return { canvas, context };
}

function drawMilestones(context, y, width) {
  const start = 180;
  const end = width - 180;
  context.strokeStyle = 'rgba(47,36,25,.34)';
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(start, y);
  context.lineTo(end, y);
  context.stroke();
  for (let index = 0; index < 7; index += 1) {
    const x = start + ((end - start) * index) / 6;
    context.beginPath();
    context.arc(x, y, 24, 0, Math.PI * 2);
    context.fillStyle = index === 6 ? VERMILION : INK;
    context.fill();
    context.fillStyle = PAPER;
    context.font = '800 23px Pretendard, sans-serif';
    context.textAlign = 'center';
    context.fillText('✓', x, y + 8);
  }
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG creation failed'))), 'image/png');
  });
}

export async function createChallengeCertificate({ certificate, completionDays, memoir }) {
  const { canvas, context } = await prepare(1200, 1600);
  context.fillStyle = 'rgba(247,238,219,.84)';
  roundRect(context, 92, 92, 1016, 1140, 22);
  context.fill();
  context.strokeStyle = INK;
  context.lineWidth = 3;
  context.stroke();
  context.strokeStyle = VERMILION;
  context.lineWidth = 1;
  context.strokeRect(108, 108, 984, 1108);

  context.textAlign = 'center';
  context.fillStyle = VERMILION;
  context.font = '800 24px Pretendard, sans-serif';
  context.fillText('GIVE ECOSYSTEM  ·  SEVEN-DAY PRACTICE', 600, 195);

  context.fillStyle = INK;
  context.font = '700 46px "Give Hahmlet", serif';
  context.fillText('내 선의를 지키는 기준을', 600, 310);
  context.font = '700 82px "Give Hahmlet", serif';
  context.fillText('끝까지 연습했습니다', 600, 430);

  context.fillStyle = VERMILION;
  context.font = '700 168px "Give Hahmlet", serif';
  context.fillText('7일', 600, 640);
  context.fillStyle = INK;
  context.font = '800 28px Pretendard, sans-serif';
  context.fillText('경계 연습 완주 인증서', 600, 700);

  drawMilestones(context, 790, 1200);

  context.fillStyle = INK;
  context.font = '400 46px "Give Brush", sans-serif';
  const anchor = memoir?.anchor || '나는 더 이상 자동으로 수락하지 않는다.';
  wrapText(context, `“${anchor}”`, 600, 900, 790, 52, 2);

  const stats = `${completionDays}/7 DAYS   ·   ${certificate.completedMissions}/21 MISSIONS   ·   ${memoir?.noteCount || 0} NOTES`;
  context.fillStyle = 'rgba(47,36,25,.9)';
  roundRect(context, 250, 1035, 700, 72, 36);
  context.fill();
  context.fillStyle = PAPER;
  context.font = '800 23px Pretendard, sans-serif';
  context.fillText(stats, 600, 1080);

  context.fillStyle = 'rgba(247,238,219,.92)';
  roundRect(context, 90, 1320, 1020, 190, 18);
  context.fill();
  context.textAlign = 'left';
  context.fillStyle = INK;
  context.font = '700 23px Pretendard, sans-serif';
  context.fillText('OFFICIALLY COMPLETED', 130, 1382);
  context.font = '500 21px Pretendard, sans-serif';
  context.fillText(new Date(certificate.issuedAt).toLocaleDateString('ko-KR'), 130, 1425);
  context.textAlign = 'right';
  context.font = '500 19px ui-monospace, monospace';
  context.fillText(certificate.code, 1070, 1382);
  context.font = '500 14px ui-monospace, monospace';
  context.fillText(`hogoo-challenge.pages.dev/certificate.html?code=${certificate.code}`, 1070, 1425);
  context.fillStyle = VERMILION;
  context.font = '800 21px Pretendard, sans-serif';
  context.fillText('검증 가능한 디지털 원본', 1070, 1470);

  return canvasToBlob(canvas);
}

export async function createChallengeShareCard({ memoir, completionDays }) {
  const { canvas, context } = await prepare(1080, 1350);
  context.fillStyle = 'rgba(247,238,219,.9)';
  roundRect(context, 64, 64, 952, 820, 30);
  context.fill();

  context.textAlign = 'left';
  context.fillStyle = VERMILION;
  context.font = '800 25px Pretendard, sans-serif';
  context.fillText('7-DAY BOUNDARY PRACTICE  ·  COMPLETED', 112, 145);
  context.fillStyle = INK;
  context.font = '700 72px "Give Hahmlet", serif';
  context.fillText('나는 7일 동안,', 112, 275);
  context.fillText('자동 수락 대신', 112, 375);
  context.fillStyle = VERMILION;
  context.font = '400 92px "Give Brush", sans-serif';
  context.fillText('내 기준을 연습했다.', 112, 480);

  context.fillStyle = INK;
  context.font = '400 42px "Give Brush", sans-serif';
  wrapText(context, `“${memoir?.anchor || '나는 더 이상 자동으로 수락하지 않는다.'}”`, 112, 585, 820, 50, 2);

  const metrics = [
    [`${completionDays}/7`, '완주'],
    [`${memoir?.completedMissions || 0}/21`, '미션'],
    [`${memoir?.noteCount || 0}`, '기록'],
  ];
  metrics.forEach(([value, label], index) => {
    const x = 112 + index * 290;
    context.fillStyle = INK;
    context.font = '800 45px Pretendard, sans-serif';
    context.fillText(value, x, 755);
    context.fillStyle = '#74604b';
    context.font = '700 19px Pretendard, sans-serif';
    context.fillText(label, x, 795);
  });

  drawMilestones(context, 960, 1080);
  context.textAlign = 'left';
  context.fillStyle = 'rgba(47,36,25,.9)';
  roundRect(context, 64, 1110, 952, 176, 24);
  context.fill();
  context.fillStyle = PAPER;
  context.font = '400 38px "Give Brush", sans-serif';
  context.fillText('친절함을 버린 게 아니라, 지키는 법을 배웠다.', 112, 1180);
  context.font = '700 20px Pretendard, sans-serif';
  context.fillText('GIVE ECOSYSTEM  ·  hogoo-challenge.pages.dev', 112, 1232);

  return canvasToBlob(canvas);
}

export function downloadRewardImage(blob, filename) {
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = href;
  link.click();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

function drawMemoirFrame(context, page, title) {
  context.fillStyle = 'rgba(247,238,219,.94)';
  roundRect(context, 70, 70, 1060, 1460, 18);
  context.fill();
  context.strokeStyle = 'rgba(47,36,25,.4)';
  context.lineWidth = 2;
  context.stroke();
  context.textAlign = 'left';
  context.fillStyle = VERMILION;
  context.font = '800 22px Pretendard, sans-serif';
  context.fillText('MY SEVEN DAYS  ·  GIVE ECOSYSTEM', 118, 145);
  context.fillStyle = INK;
  // 뒤쪽 회고 페이지처럼 제목이 길어져도 오른쪽 인장 여백을 넘지 않게 한다.
  let titleSize = 52;
  context.font = `700 ${titleSize}px "Give Hahmlet", serif`;
  while (context.measureText(title).width > 920 && titleSize > 38) {
    titleSize -= 2;
    context.font = `700 ${titleSize}px "Give Hahmlet", serif`;
  }
  context.fillText(title, 118, 230);
  context.textAlign = 'right';
  context.font = '700 19px Pretendard, sans-serif';
  context.fillText(`${page} / 4`, 1082, 145);
  context.textAlign = 'left';
}

function drawMetric(context, x, value, label) {
  context.fillStyle = INK;
  context.font = '800 47px Pretendard, sans-serif';
  context.fillText(value, x, 870);
  context.fillStyle = '#78644f';
  context.font = '700 20px Pretendard, sans-serif';
  context.fillText(label, x, 910);
}

function drawScoreChart(context, memoir) {
  const left = 155;
  const top = 410;
  const width = 890;
  const height = 520;
  context.strokeStyle = 'rgba(47,36,25,.16)';
  context.lineWidth = 2;
  for (let score = 0; score <= 10; score += 2) {
    const y = top + height - (score / 10) * height;
    context.beginPath();
    context.moveTo(left, y);
    context.lineTo(left + width, y);
    context.stroke();
    context.fillStyle = '#897762';
    context.font = '600 18px Pretendard, sans-serif';
    context.textAlign = 'right';
    context.fillText(String(score), left - 18, y + 6);
  }
  for (let day = 1; day <= 7; day += 1) {
    const x = left + ((day - 1) / 6) * width;
    context.fillStyle = '#897762';
    context.textAlign = 'center';
    context.fillText(`D${day}`, x, top + height + 42);
  }

  const series = [
    [memoir.anxietySeries || [], VERMILION],
    [memoir.guiltSeries || [], '#9a762e'],
  ];
  for (const [entries, color] of series) {
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth = 6;
    entries.forEach((entry, index) => {
      const x = left + ((entry.day - 1) / 6) * width;
      const y = top + height - (entry.score / 10) * height;
      const previous = entries[index - 1];
      if (previous && entry.day - previous.day === 1) {
        const px = left + ((previous.day - 1) / 6) * width;
        const py = top + height - (previous.score / 10) * height;
        context.beginPath();
        context.moveTo(px, py);
        context.lineTo(x, y);
        context.stroke();
      }
      context.beginPath();
      context.arc(x, y, 11, 0, Math.PI * 2);
      context.fill();
    });
  }
  context.textAlign = 'left';
}

function changeLabel(change) {
  if (!change) return '기록 없음';
  const direction = change.change > 0 ? `+${change.change}` : String(change.change);
  return `Day ${change.startDay} ${change.start} → Day ${change.endDay} ${change.end} (${direction})`;
}

function drawDailyEntries(context, entries) {
  let y = 340;
  entries.forEach((entry) => {
    context.fillStyle = VERMILION;
    context.font = '800 20px Pretendard, sans-serif';
    context.fillText(`DAY ${entry.day}`, 120, y);
    context.fillStyle = INK;
    context.font = '700 31px "Give Hahmlet", serif';
    context.fillText(entry.title, 250, y);
    context.fillStyle = '#78644f';
    context.font = '600 19px Pretendard, sans-serif';
    context.fillText(`미션 ${entry.completedMissions}/3${entry.anxiety !== null ? `  ·  불안 ${entry.anxiety}` : ''}${entry.guilt !== null ? `  ·  죄책감 ${entry.guilt}` : ''}`, 250, y + 38);
    context.fillStyle = INK;
    context.font = '600 22px Pretendard, sans-serif';
    wrapText(context, entry.note || '이 날은 행동 메모를 남기지 않았어요.', 250, y + 82, 790, 34, 2);
    if (entry.phrase) {
      context.fillStyle = VERMILION;
      context.font = '700 20px "Give Hahmlet", serif';
      wrapText(context, `“${entry.phrase}”`, 250, y + 150, 790, 32, 2);
    }
    context.strokeStyle = 'rgba(47,36,25,.16)';
    context.beginPath();
    context.moveTo(120, y + 205);
    context.lineTo(1080, y + 205);
    context.stroke();
    y += 255;
  });
}

export async function createChallengeMemoirPages(memoir) {
  const pages = [];

  const cover = await prepare(1200, 1600);
  drawMemoirFrame(cover.context, 1, '나의 7일 경계 연습 회고록');
  cover.context.fillStyle = INK;
  cover.context.font = '700 68px "Give Hahmlet", serif';
  cover.context.fillText('친절함을 버리지 않고,', 118, 430);
  cover.context.fillStyle = VERMILION;
  cover.context.font = '400 84px "Give Brush", sans-serif';
  cover.context.fillText('나를 지킨 일곱 번의 선택', 118, 530);
  cover.context.fillStyle = INK;
  cover.context.font = '400 42px "Give Brush", sans-serif';
  wrapText(cover.context, `“${memoir.anchor}”`, 118, 680, 920, 48, 3);
  drawMetric(cover.context, 118, `${memoir.completedMissions}/21`, '완료 미션');
  drawMetric(cover.context, 430, String(memoir.noteCount), '행동 메모');
  drawMetric(cover.context, 700, String(memoir.recordedScoreDays || 0), '감정 기록일');
  cover.context.fillStyle = 'rgba(47,36,25,.91)';
  roundRect(cover.context, 118, 1080, 964, 300, 18);
  cover.context.fill();
  cover.context.fillStyle = PAPER;
  cover.context.font = '700 29px "Give Hahmlet", serif';
  cover.context.fillText('이 기록에 없는 감정과 행동은 지어내지 않았습니다.', 165, 1160);
  cover.context.font = '600 22px Pretendard, sans-serif';
  wrapText(cover.context, '내가 직접 남긴 미션, 문장, 메모와 점수만으로 일곱 날을 다시 엮었습니다.', 165, 1220, 860, 36, 3);
  pages.push(cover.canvas);

  const change = await prepare(1200, 1600);
  drawMemoirFrame(change.context, 2, '내 감정 기록의 흐름');
  drawScoreChart(change.context, memoir);
  change.context.fillStyle = VERMILION;
  change.context.fillRect(118, 1060, 22, 22);
  change.context.fillStyle = INK;
  change.context.font = '700 23px Pretendard, sans-serif';
  change.context.fillText(`불안 · ${changeLabel(memoir.anxietyChange)}`, 160, 1080);
  change.context.fillStyle = '#9a762e';
  change.context.fillRect(118, 1120, 22, 22);
  change.context.fillStyle = INK;
  change.context.fillText(`죄책감 · ${changeLabel(memoir.guiltChange)}`, 160, 1140);
  change.context.fillStyle = '#78644f';
  change.context.font = '600 20px Pretendard, sans-serif';
  wrapText(change.context, '점이 없는 날은 기록하지 않은 날입니다. 비어 있는 구간을 추정해서 연결하지 않았어요.', 118, 1245, 940, 34, 3);
  pages.push(change.canvas);

  const firstDays = await prepare(1200, 1600);
  drawMemoirFrame(firstDays.context, 3, 'Day 1—4 · 멈추고 기준 세우기');
  drawDailyEntries(firstDays.context, memoir.daily.slice(0, 4));
  pages.push(firstDays.canvas);

  const lastDays = await prepare(1200, 1600);
  drawMemoirFrame(lastDays.context, 4, 'Day 5—7 · 내 방식으로 이어가기');
  drawDailyEntries(lastDays.context, memoir.daily.slice(4));
  lastDays.context.fillStyle = 'rgba(159,50,35,.09)';
  roundRect(lastDays.context, 118, 1125, 964, 250, 16);
  lastDays.context.fill();
  lastDays.context.fillStyle = VERMILION;
  lastDays.context.font = '800 19px Pretendard, sans-serif';
  lastDays.context.fillText('NEXT SEVEN DAYS', 160, 1190);
  lastDays.context.fillStyle = INK;
  lastDays.context.font = '400 42px "Give Brush", sans-serif';
  wrapText(lastDays.context, `“${memoir.anchor}”`, 160, 1260, 860, 46, 2);
  pages.push(lastDays.canvas);

  return pages;
}

export async function downloadChallengeMemoirPdf(memoir) {
  const [{ jsPDF }, pages] = await Promise.all([
    import('jspdf'),
    createChallengeMemoirPages(memoir),
  ]);
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [1200, 1600], hotfixes: ['px_scaling'], compress: true });
  pages.forEach((canvas, index) => {
    if (index) pdf.addPage([1200, 1600], 'portrait');
    pdf.addImage(canvas.toDataURL('image/jpeg', .9), 'JPEG', 0, 0, 1200, 1600, undefined, 'FAST');
  });
  pdf.save('나의-7일-경계연습-회고록.pdf');
}
