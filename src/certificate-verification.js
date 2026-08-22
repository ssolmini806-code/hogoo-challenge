import { supabase } from './supabase';

const status = document.getElementById('certificateStatus');
const details = document.getElementById('certificateDetails');
const code = new URLSearchParams(window.location.search).get('code') || '';

async function verify() {
  if (!code) {
    status.classList.add('is-invalid');
    status.innerHTML = '<strong>발급번호가 없습니다.</strong><span>인증서에 적힌 검증 주소를 다시 확인해주세요.</span>';
    return;
  }

  const { data, error } = await supabase.functions.invoke('challenge-certificate', {
    body: { action: 'verify', code },
  });
  if (error || !data?.valid) {
    status.classList.add('is-invalid');
    status.innerHTML = '<strong>공식 발급 기록을 찾지 못했습니다.</strong><span>번호가 변조됐거나 존재하지 않는 인증서입니다.</span>';
    details.textContent = `확인한 발급번호 · ${code}`;
    return;
  }

  status.classList.add('is-valid');
  status.innerHTML = '<strong>공식 발급된 인증서입니다.</strong><span>7일 경계 연습과 21개 미션을 완료한 기록이 확인됐습니다.</span>';
  details.textContent = `발급일 · ${new Date(data.certificate.issuedAt).toLocaleDateString('ko-KR')} · 발급번호 ${data.certificate.code}`;
}

verify().catch(() => {
  status.classList.add('is-invalid');
  status.innerHTML = '<strong>지금은 확인할 수 없습니다.</strong><span>잠시 후 다시 시도해주세요.</span>';
});
